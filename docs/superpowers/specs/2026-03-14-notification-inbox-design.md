# 알림함 기능 설계

> 날짜: 2026-03-14
> 범위: MVP 1 — 파트너 지출 알림 + 댓글 알림 (고정지출 리마인더 제외)

---

## 개요

알림이 수신되면 앱 내 알림함에 쌓이고, 사용자가 나중에 확인할 수 있는 기능.
기존 `NotificationInbox` 컴포넌트는 빈 상태(empty state)만 있으므로, 실제 알림 목록을 표시하도록 교체한다.

---

## 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 저장 위치 | Supabase DB (`notifications` 테이블) | 기기 재설치 후에도 유지, 읽음 상태 동기화 |
| 아이템 디자인 | 컴팩트 (아이콘 + 제목 + 서브텍스트) | 많은 알림을 한눈에, 기존 앱 밀도와 일관성 |
| 알림 아이콘 | DB 저장 카테고리 icon/color 사용 | 지출·고정지출 알림은 카테고리 아이콘이 직관적 |
| 댓글 알림 아이콘 | Lucide `MessageCircle` | 카테고리 없음 |
| 배지 | Peach 숫자 배지, 알림함 열면 전체 읽음 | 빠른 알림 인지 |
| 알림 생성 | Supabase DB trigger | 서버 레벨, 앱 종료 시에도 동작 |
| 고정지출 리마인더 | **이번 범위 제외** | pg_cron 필요, MVP 이후 |

---

## DB 스키마

### `notifications` 테이블 신규 추가

```sql
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  type         text not null check (type in ('partner_transaction', 'comment')),
  title        text not null,
  body         text not null,
  icon         text,         -- 카테고리 emoji (없으면 null)
  icon_color   text,         -- 카테고리 hex color (없으면 null)
  reference_id uuid,         -- transaction_id 또는 comment_id
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);
```

- `icon`, `icon_color`: 생성 시점 카테고리에서 비정규화 복사 → 카테고리 변경에 영향 받지 않음
- `reference_id`: 나중에 해당 지출/댓글로 네비게이션할 때 사용 (현재 MVP에서는 탭 이동 없이 알림만 표시)

### RLS

- `SELECT`: `user_id = auth.uid()`
- `UPDATE`: `user_id = auth.uid()` (읽음 처리)
- `INSERT`, `DELETE`: 앱에서 직접 불가 (trigger만 삽입)

### DB Trigger

**파트너 지출 알림** — `transactions` INSERT 후:

```sql
-- 수신자 조회: users WHERE couple_id = NEW.couple_id AND id != NEW.user_id
-- (같은 커플에서 트랜잭션 작성자를 제외한 상대방 1명)
-- 아이콘 조회: categories WHERE id = NEW.category_id → icon, color
-- notifications INSERT:
--   user_id    = 수신자.id
--   type       = 'partner_transaction'
--   title      = 작성자.nickname || '이 지출을 기록했어요'  (작성자 닉네임, 수신자 아님)
--   body       = category.name || ' · ' || NEW.amount || '원'
--   icon       = category.icon   (categories.icon → notifications.icon 비정규화 복사)
--   icon_color = category.color
--   reference_id = NEW.id
-- 수신자가 없으면(커플 미연동) 삽입 생략
```

**댓글 알림** — `comments` INSERT 후:

```sql
-- 수신자 조회: transactions WHERE id = NEW.transaction_id → user_id
-- 조건: transactions.user_id != NEW.user_id  (자기 지출에 자기 댓글이면 알림 없음 — 의도적 설계)
--   파트너가 자기 지출에 댓글 달아도 마찬가지로 알림 없음 (알림 수신자 = 지출 작성자이므로)
-- 댓글 작성자 닉네임 조회: users WHERE id = NEW.user_id → nickname
-- notifications INSERT:
--   user_id    = transactions.user_id
--   type       = 'comment'
--   title      = '새 댓글이 달렸어요'
--   body       = 작성자.nickname || ': "' || NEW.content || '"'
--   icon       = null  (앱에서 MessageCircle 렌더링)
--   icon_color = null
--   reference_id = NEW.transaction_id
-- transactions.user_id = NEW.user_id이면 트리거 조기 종료 (RETURN NULL)
```

---

## 앱 아키텍처

### 신규 파일

```
hooks/use-notifications.ts
  - useNotifications(): React Query로 내 알림 목록 조회 (최신순 50개, is_read 무관)
  - Supabase Realtime 구독:
      채널명: 'notifications:<user_id>'
      filter: user_id=eq.<user_id>
      이벤트: INSERT → React Query 캐시 invalidate
      cleanup: useEffect return에서 supabase.removeChannel()
      기존 앱의 Realtime 훅(use-transactions, use-comments) 패턴 동일하게 적용
  - markAllAsRead():
      UPDATE notifications SET is_read=true WHERE user_id=me AND is_read=false
      이후 React Query 캐시 invalidate
      호출 시점: 모달 open 후 데이터 로드 완료(isSuccess) 시 (낙관적 업데이트 미사용)
  - unreadCount: number — 반환 데이터에서 filter(n => !n.is_read).length

components/settings/notification-item.tsx
  - Props: { notification: Notification }
  - 컴팩트 디자인: 아이콘 박스 + 제목 + 서브텍스트 + 읽음 점
  - 아이콘: notification.icon이 있으면 category emoji + icon_color 배경
            없으면 Lucide MessageCircle + lavender 배경
```

### 수정 파일

```
components/settings/notification-inbox.tsx
  - useNotifications() 호출
  - 알림 목록 FlatList 렌더링
  - isSuccess 상태에서 markAllAsRead() 호출 (useEffect dependency: [isSuccess])
  - 빈 상태: 기존 empty state 유지

app/(tabs)/settings.tsx
  - useNotifications()에서 unreadCount import
  - 기존 Bell TouchableOpacity를 <View className="relative">로 감싸고,
    unreadCount > 0일 때 <View className="absolute -top-1 -right-1 ...">로 배지 추가
    (NativeWind className 사용, inline style 금지)
  - 배지 텍스트: unreadCount <= 9 ? String(unreadCount) : '9+'

types/database.ts
  - notifications 테이블 Row/Insert/Update 타입 추가
```

### 수정 없는 파일

```
store/notification-settings.ts  -- 푸시 ON/OFF 토글, 그대로 유지
```

### notification-settings 토글과의 관계

`store/notification-settings.ts`의 `partnerTransaction`, `comment` 토글은 **푸시 알림 발송 여부**만 제어한다.
**알림함 DB 저장은 토글 상태와 무관하게 항상 발생**한다.

- DB trigger는 토글 설정을 알 수 없으므로 항상 `notifications` 테이블에 삽입
- 실제 Expo 푸시 발송 로직(Edge Function 등)에서 수신자의 토글 설정을 확인해 푸시 생략
- 사용자는 토글을 꺼도 알림함에서 기록을 확인할 수 있음

---

## 데이터 흐름

```
파트너가 지출 입력
  → transactions INSERT
  → DB trigger 실행
  → notifications INSERT (for me)
  → Supabase Realtime 구독 → useNotifications 캐시 갱신
  → 설정 탭 벨 아이콘에 배지 +1

사용자가 벨 아이콘 탭
  → NotificationInbox 모달 open
  → markAllAsRead() 호출 → is_read = true (전체)
  → 배지 사라짐
  → 알림 목록 표시 (읽은 것은 흐리게)
```

---

## UI 상세

### `NotificationItem`

```
[ 아이콘박스 36×36 rounded-xl ]  [ 제목 font-ibm-semibold text-sm ]  [ ● 읽음점 ]
  카테고리 emoji / MessageCircle   [ 서브텍스트 font-ibm-regular text-xs text-brown/50 ]
```

- 읽음 점: peach 색, `is_read = false`일 때만 표시
- 읽은 알림: 전체 opacity 0.5 → 0.7 정도로 흐리게
- 배경: `bg-cream rounded-2xl` 카드 스타일

### 벨 아이콘 배지

- `unreadCount > 0`일 때만 렌더링
- 크기: 16×16, `rounded-full bg-peach`
- 숫자: 9 이하 표시, 10+ → "9+"

---

## 마이그레이션 파일

```
supabase/migrations/20260314000001_notifications.sql
  — notifications 테이블 생성
  — RLS 정책
  — partner_transaction trigger 함수 + trigger
  — comment trigger 함수 + trigger
```

---

## 범위 외 (MVP 이후)

- 고정지출 리마인더 알림 (pg_cron 필요)
- 알림 개별 삭제
- 알림 탭 눌러서 해당 지출/댓글로 네비게이션
- 탭바 배지 (현재는 설정 탭 내 벨 아이콘에만)
- 알림함 페이지네이션 (현재 최신 50개 고정, 50개 초과 시 오래된 알림은 앱에서 미표시)
- 개별 알림 읽음 처리 (현재 알림함 열면 전체 읽음)
