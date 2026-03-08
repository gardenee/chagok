# 차곡

> "따로의 소비, 같이의 차곡" — 부부/커플을 위한 공유 가계부 iOS 앱

---

## 개발 환경 실행

```bash
# 의존성 설치
npm install --legacy-peer-deps

# iOS 시뮬레이터 실행
npx expo start --ios

# 또는 Metro 서버만 실행 (기기에서 QR 스캔)
npx expo start
```

---

## 코드 포맷팅 (Prettier)

```bash
# ts/tsx 파일 자동 포맷
npm run format

# ts/tsx 파일 포맷 적용 여부만 검사 (CI 용도)
npm run format:check
```

---

## Supabase

```bash
# DB 마이그레이션 적용 (원격)
npx supabase db push

# 마이그레이션 상태 확인
npx supabase migration list

# 새 마이그레이션 파일 생성
npx supabase migration new <name>

# 로컬 Supabase 서버 시작 (선택)
npx supabase start

# 로컬 Supabase 서버 종료
npx supabase stop
```

---

## 빌드

```bash
# EAS 프로덕션 빌드 (iOS)
eas build --platform ios

# EAS 개발 빌드
eas build --platform ios --profile development
```

---

## 환경 변수

`.env.local` 파일에 설정:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 참고

- `CLAUDE.md` — 개발 지침, 디자인 원칙
- `codemap.md` — 코드 구조 레퍼런스
- `supabase/migrations/` — DB 마이그레이션 히스토리
