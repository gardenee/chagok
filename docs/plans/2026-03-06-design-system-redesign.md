# 차곡 디자인 시스템 리디자인

## 컬러 팔레트

| 이름 | hex | 용도 |
|------|-----|------|
| butter | `#FAD97A` | 메인 배경, 포인트 컬러 |
| brown | `#7B5E3A` | 다크 텍스트, 아이콘 (olive 대체) |
| cream | `#FEFCF5` | 카드/버튼 배경 |
| peach | `#F7B8A0` | 보조 포인트 |
| lavender | `#D4C5F0` | 보조 포인트 |
| white | `#FFFFFF` | butter 배경 위 텍스트 |

- olive 완전 제거 → brown 대체
- butter를 배경색으로 사용 시 white 텍스트 조합

## 타이포그래피 시스템

| 토큰 | 폰트 | 크기 | 색상 | 용도 |
|------|------|------|------|------|
| display | Gowun Dodum | 5xl | white | 앱 타이틀 (butter 배경 위) |
| title | Gowun Dodum | 3xl | white / brown | 화면 제목 |
| heading | system bold | lg | brown | 카드/섹션 제목 |
| body | system | base | brown/80 | 본문 |
| caption | system | sm | brown/50 | 부가 설명, 라벨 |

## 인트로 화면

- 배경: butter(`#FAD97A`) 풀스크린
- "차곡": Gowun Dodum, white, display 크기
- 슬로건: white/70, caption 스타일
- "시작하기" 버튼: cream 배경 + brown 텍스트 + 소프트 섀도우

## 로그인 화면 (1차 — 확정 후 업데이트)

- 배경: butter 동일
- "로그인": Gowun Dodum, white
- 버튼 3개 cream 카드 스타일 통일 예정 (디자인 확인 후 확정)
