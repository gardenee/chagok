# 알림함 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파트너 지출·댓글 발생 시 알림을 Supabase DB에 쌓고, 설정 탭 알림함에서 확인할 수 있게 한다.

**Architecture:** DB trigger가 transactions/comments INSERT 시 수신자의 notifications 레코드를 자동 생성. 앱은 React Query + Supabase Realtime으로 실시간 조회. 설정 탭 벨 아이콘에 안읽음 배지 표시.

**Tech Stack:** Supabase PostgreSQL (trigger, RLS), TypeScript, React Query, NativeWind, Lucide icons

---

## 파일 구조

| 파일 | 작업 | 역할 |
|------|------|------|
| `supabase/migrations/20260314000001_notifications.sql` | 신규 | notifications 테이블 + RLS + trigger |
| `types/database.ts` | 수정 | notifications 테이블 타입 추가 |
| `services/notifications.ts` | 수정 | fetchNotifications, markAllAsRead 추가 |
| `hooks/use-notifications.ts` | 신규 | React Query + Realtime 훅 |
| `components/settings/notification-item.tsx` | 신규 | 컴팩트 알림 아이템 컴포넌트 |
| `components/settings/notification-inbox.tsx` | 수정 | 실제 알림 목록으로 교체 |
| `app/(tabs)/settings.tsx` | 수정 | 벨 아이콘 배지 추가 |

---

## Chunk 1: DB 스키마 + 타입

### Task 1: notifications 마이그레이션 작성

**Files:**
- Create: `supabase/migrations/20260314000001_notifications.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- supabase/migrations/20260314000001_notifications.sql

-- 1. notifications 테이블
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  type         text not null check (type in ('partner_transaction', 'comment')),
  title        text not null,
  body         text not null,
  icon         text,
  icon_color   text,
  reference_id uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 2. RLS 활성화
alter table notifications enable row level security;

-- 3. RLS 정책
create policy "사용자는 자신의 알림만 조회"
  on notifications for select
  using (user_id = auth.uid());

create policy "사용자는 자신의 알림만 읽음 처리"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 앱에서 직접 INSERT/DELETE 불가 (trigger만 삽입)

-- 4. 인덱스 (사용자별 최신순 조회 최적화)
create index if not exists notifications_user_id_created_at_idx
  on notifications(user_id, created_at desc);

-- 5. Realtime 활성화
alter publication supabase_realtime add table notifications;
```

- [ ] **Step 2: 파트너 지출 알림 trigger 함수 추가**

```sql
-- 파트너 지출 알림 trigger 함수
create or replace function notify_partner_transaction()
returns trigger language plpgsql security definer as $$
declare
  v_receiver_id   uuid;
  v_sender_nick   text;
  v_category_name text;
  v_category_icon text;
  v_category_color text;
begin
  -- 수신자: 같은 커플에서 작성자를 제외한 파트너
  select id into v_receiver_id
  from users
  where couple_id = NEW.couple_id
    and id != NEW.user_id
  limit 1;

  -- 파트너 없으면 알림 생략
  if v_receiver_id is null then
    return NEW;
  end if;

  -- 작성자 닉네임 조회
  select nickname into v_sender_nick
  from users where id = NEW.user_id;

  -- 카테고리 정보 조회 (없을 수 있음)
  if NEW.category_id is not null then
    select name, icon, color
    into v_category_name, v_category_icon, v_category_color
    from categories where id = NEW.category_id;
  end if;

  insert into notifications(user_id, type, title, body, icon, icon_color, reference_id)
  values (
    v_receiver_id,
    'partner_transaction',
    coalesce(v_sender_nick, '짝꿍') || '이 지출을 기록했어요',
    coalesce(v_category_name, '기타') || ' · ' || NEW.amount || '원',
    v_category_icon,
    v_category_color,
    NEW.id
  );

  return NEW;
end;
$$;

create trigger trg_notify_partner_transaction
  after insert on transactions
  for each row execute function notify_partner_transaction();
```

- [ ] **Step 3: 댓글 알림 trigger 함수 추가**

```sql
-- 댓글 알림 trigger 함수
create or replace function notify_partner_comment()
returns trigger language plpgsql security definer as $$
declare
  v_transaction_owner_id uuid;
  v_commenter_nick       text;
begin
  -- 지출 작성자 조회
  select user_id into v_transaction_owner_id
  from transactions where id = NEW.transaction_id;

  -- 자기 지출에 자기가 댓글 → 알림 없음 (의도적 설계)
  if v_transaction_owner_id = NEW.user_id then
    return NEW;
  end if;

  -- 댓글 작성자 닉네임 조회
  select nickname into v_commenter_nick
  from users where id = NEW.user_id;

  insert into notifications(user_id, type, title, body, icon, icon_color, reference_id)
  values (
    v_transaction_owner_id,
    'comment',
    '새 댓글이 달렸어요',
    coalesce(v_commenter_nick, '짝꿍') || ': "' || NEW.content || '"',
    null,   -- 앱에서 MessageCircle 아이콘 렌더링
    null,
    NEW.transaction_id
  );

  return NEW;
end;
$$;

create trigger trg_notify_partner_comment
  after insert on comments
  for each row execute function notify_partner_comment();
```

- [ ] **Step 4: 마이그레이션 적용**

```bash
npx supabase db push
```

Expected: 오류 없이 완료. `npx supabase migration list`에서 20260314000001_notifications 확인.

- [ ] **Step 5: Supabase 대시보드에서 트리거 동작 확인**

Table Editor → transactions에 테스트 레코드 INSERT → notifications 테이블에 레코드 생성 여부 확인.

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations/20260314000001_notifications.sql
git commit -m "feat: notifications 테이블 + trigger 마이그레이션"
```

---

### Task 2: TypeScript 타입 추가

**Files:**
- Modify: `types/database.ts`

- [ ] **Step 1: notifications 테이블 타입을 Database 인터페이스에 추가**

`types/database.ts`의 `Tables` 안에 `holidays` 다음에 추가:

```typescript
notifications: {
  Row: {
    id: string;
    user_id: string;
    type: 'partner_transaction' | 'comment';
    title: string;
    body: string;
    icon: string | null;
    icon_color: string | null;
    reference_id: string | null;
    is_read: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    type: 'partner_transaction' | 'comment';
    title: string;
    body: string;
    icon?: string | null;
    icon_color?: string | null;
    reference_id?: string | null;
    is_read?: boolean;
    created_at?: string;
  };
  Update: {
    is_read?: boolean;
  };
  Relationships: never[];
};
```

- [ ] **Step 2: 파일 하단에 편의 alias 추가**

`types/database.ts` 하단 alias 섹션에:

```typescript
export type Notification =
  Database['public']['Tables']['notifications']['Row'];
```

- [ ] **Step 3: 포맷팅 확인**

```bash
npm run format:check
```

실패 시:
```bash
npm run format
npm run format:check
```

- [ ] **Step 4: 커밋**

```bash
git add types/database.ts
git commit -m "feat: notifications 테이블 TypeScript 타입 추가"
```

---

## Chunk 2: 서비스 + 훅

### Task 3: notifications 서비스 함수 추가

**Files:**
- Modify: `services/notifications.ts`

- [ ] **Step 1: fetchNotifications, markAllAsRead 함수 추가**

`services/notifications.ts` 파일 상단 기존 import 목록에 타입 import 추가:

```typescript
import type { Notification } from '@/types/database';
```

그런 다음 파일 끝에 함수 추가 (기존 내용 유지):

```typescript
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}
```

> **주의:** 파일 상단 import 목록에 이미 `supabase`가 있으므로 중복 import 금지.
> `Notification` 타입 import는 파일 상단에 추가.

- [ ] **Step 2: 포맷팅 확인**

```bash
npm run format:check
```

실패 시: `npm run format` 후 재확인

- [ ] **Step 3: 커밋**

```bash
git add services/notifications.ts
git commit -m "feat: notifications 서비스 함수 추가 (fetchNotifications, markAllAsRead)"
```

---

### Task 4: use-notifications 훅 작성

**Files:**
- Create: `hooks/use-notifications.ts`

- [ ] **Step 1: 훅 파일 작성**

```typescript
// hooks/use-notifications.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from '@/services/notifications';
import type { Notification } from '@/types/database';

export type { Notification };

export function useNotifications() {
  const { session } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  // Realtime 구독: 새 알림 INSERT 시 캐시 갱신
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
  });
}

export function useUnreadCount() {
  const result = useNotifications();
  const unreadCount = (result.data ?? []).filter(n => !n.is_read).length;
  return { ...result, unreadCount };
}

export function useMarkAllNotificationsAsRead() {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  // useCallback으로 안정적인 참조 유지 → useEffect dependency 오류 방지
  return useCallback(
    async function markAllAsRead() {
      if (!userId) return;
      await markAllNotificationsAsRead(userId);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    [userId, queryClient],
  );
}
```

- [ ] **Step 2: 포맷팅 확인**

```bash
npm run format:check
```

실패 시: `npm run format` 후 재확인

- [ ] **Step 3: 커밋**

```bash
git add hooks/use-notifications.ts
git commit -m "feat: use-notifications 훅 (React Query + Realtime)"
```

---

## Chunk 3: UI 컴포넌트

### Task 5: NotificationItem 컴포넌트 작성

**Files:**
- Create: `components/settings/notification-item.tsx`

- [ ] **Step 1: notification-item.tsx 작성**

```typescript
// components/settings/notification-item.tsx
import { View, Text } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import type { Notification } from '@/hooks/use-notifications';

type Props = {
  notification: Notification;
};

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export function NotificationItem({ notification }: Props) {
  const hasIcon = !!notification.icon;
  const isUnread = !notification.is_read;

  return (
    // 읽은 알림은 흐리게 (opacity-60)
    <View className={`flex-row items-center gap-3 px-4 py-3 bg-cream-light rounded-2xl ${isUnread ? '' : 'opacity-60'}`}>
      {/* 아이콘 박스 */}
      {hasIcon ? (
        <View
          className='w-9 h-9 rounded-xl items-center justify-center flex-shrink-0'
          style={{ backgroundColor: notification.icon_color ?? '#FAD97A' }}
        >
          <Text style={{ fontSize: 18 }}>{notification.icon}</Text>
        </View>
      ) : (
        <View className='w-9 h-9 rounded-xl bg-lavender items-center justify-center flex-shrink-0'>
          <MessageCircle size={18} color='#7B5E3A' strokeWidth={2} />
        </View>
      )}

      {/* 텍스트 */}
      <View className='flex-1 min-w-0'>
        <Text
          className='font-ibm-semibold text-sm text-brown'
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text
          className='font-ibm-regular text-xs text-brown/50 mt-0.5'
          numberOfLines={1}
        >
          {notification.body} · {formatRelativeTime(notification.created_at)}
        </Text>
      </View>

      {/* 읽음 점 */}
      {isUnread && (
        <View className='w-2 h-2 rounded-full bg-peach flex-shrink-0' />
      )}
    </View>
  );
}
```

> **참고:** `icon_color`는 DB에 `#` 포함한 hex 값 (`#FAD97A`)으로 저장됨. NativeWind 동적 클래스가 아닌 inline `style={{ backgroundColor }}` 사용. CLAUDE.md의 NativeWind 우선 원칙의 예외 — NativeWind가 동적 hex 색상을 지원하지 않는 경우에 해당.

- [ ] **Step 2: 포맷팅 확인**

```bash
npm run format:check
```

실패 시: `npm run format` 후 재확인

- [ ] **Step 3: 커밋**

```bash
git add components/settings/notification-item.tsx
git commit -m "feat: NotificationItem 컴포넌트"
```

---

### Task 6: NotificationInbox 교체

**Files:**
- Modify: `components/settings/notification-inbox.tsx`

- [ ] **Step 1: notification-inbox.tsx 전체 교체**

기존 파일의 empty state 모달을 실제 데이터로 교체:

```typescript
// components/settings/notification-inbox.tsx
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useEffect } from 'react';
import { Bell, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/settings/notification-item';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationInbox({ visible, onClose }: Props) {
  const { data: notifications = [], isLoading, isSuccess } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  // 데이터 로드 완료 후 전체 읽음 처리
  // visible도 dependency에 포함 → 모달 닫혔다 다시 열릴 때도 재호출 보장
  // (isSuccess만 넣으면 이미 true인 상태에서 재오픈 시 재호출 안 됨)
  // markAllAsRead는 useCallback으로 안정화되어 있으므로 dependency 포함 가능
  useEffect(() => {
    if (visible && isSuccess) {
      markAllAsRead();
    }
  }, [visible, isSuccess, markAllAsRead]);

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-cream'>
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-cream-dark'>
          <Text className='font-ibm-bold text-xl text-brown'>알림</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color='#A3A3A3' strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 목록 */}
        {isLoading ? (
          <View className='flex-1 items-center justify-center'>
            <ActivityIndicator color={Colors.brown} />
          </View>
        ) : notifications.length === 0 ? (
          <View className='flex-1 items-center justify-center gap-2'>
            <Bell size={36} color='#D4D4D4' strokeWidth={1.5} />
            <Text className='font-ibm-semibold text-sm text-brown/40'>
              아직 알림이 없어요
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <NotificationItem notification={item} />}
            contentContainerStyle={{ padding: 16, gap: 8 }} // FlatList prop은 className 미지원 → inline style 허용
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
```

- [ ] **Step 2: 포맷팅 확인**

```bash
npm run format:check
```

실패 시: `npm run format` 후 재확인

- [ ] **Step 3: 커밋**

```bash
git add components/settings/notification-inbox.tsx
git commit -m "feat: NotificationInbox 실제 알림 목록 표시"
```

---

### Task 7: 설정 탭 벨 아이콘 배지

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: settings.tsx 상단 import 수정**

기존 import에 `useUnreadCount` 추가:

```typescript
import { useUnreadCount } from '@/hooks/use-notifications';
```

- [ ] **Step 2: 컴포넌트 내 unreadCount 사용**

`SettingsScreen` 함수 내 기존 `useState` 선언부 근처에 추가:

```typescript
const { unreadCount } = useUnreadCount();
```

- [ ] **Step 3: Bell 아이콘 TouchableOpacity를 배지 래퍼로 교체**

현재 코드 (`app/(tabs)/settings.tsx:118-123`):

```tsx
<TouchableOpacity
  onPress={() => setNotifInboxVisible(true)}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>
  <Bell size={22} color={Colors.brownDarker} strokeWidth={2} />
</TouchableOpacity>
```

교체:

```tsx
<TouchableOpacity
  onPress={() => setNotifInboxVisible(true)}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>
  <View className='relative'>
    <Bell size={22} color={Colors.brownDarker} strokeWidth={2} />
    {unreadCount > 0 && (
      <View className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-peach items-center justify-center'>
        <Text className='font-ibm-bold text-[9px] text-brown'>
          {unreadCount <= 9 ? String(unreadCount) : '9+'}
        </Text>
      </View>
    )}
  </View>
</TouchableOpacity>
```

- [ ] **Step 4: 포맷팅 확인**

```bash
npm run format:check
```

- [ ] **Step 5: 시뮬레이터에서 전체 동작 확인**

```bash
npx expo start --ios --clear
```

확인 항목:
1. 설정 탭 → 벨 아이콘에 배지 표시 (알림 있을 때)
2. 벨 아이콘 탭 → 알림함 모달 open
3. 알림 목록 표시, 아이콘/제목/서브텍스트/읽음 점 정상 렌더링
4. 모달 닫고 다시 열면 읽음 점 사라짐 (전체 읽음 처리)
5. 파트너가 지출 추가 → 실시간으로 알림함에 반영 (Realtime)

- [ ] **Step 6: 커밋**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: 설정 탭 벨 아이콘 안읽음 배지"
```
