/**
 * 차곡 타이포그래피 시스템 (NativeWind className 토큰)
 *
 * butter 배경 위: display, titleWhite, captionWhite 사용
 * 일반(cream) 배경 위: title, heading, body, caption 사용
 */
export const Typography = {
  // butter 배경 위 — 흰색
  display:      'font-dodum text-5xl text-white',
  titleWhite:   'font-dodum text-3xl text-white',
  captionWhite: 'text-sm text-white/70',

  // 일반 배경 위 — brown 계열
  title:   'font-dodum text-3xl text-brown',
  heading: 'text-lg font-bold text-brown',
  body:    'text-base text-brown/80',
  caption: 'text-sm text-brown/50',
} as const;
