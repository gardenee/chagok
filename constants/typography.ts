/**
 * 차곡 타이포그래피 시스템 (NativeWind className 토큰)
 *
 * 폰트: IBMPlexSansKR
 * tailwind.config.js: font-ibm-bold / font-ibm-semibold / font-ibm-regular
 *
 * butter 배경 위: display, titleLg, subtitle 등
 * cream 배경 위: title, heading, body, caption 등
 */
export const Typography = {
  // 대형 타이틀
  display: 'font-ibm-bold text-[80px] text-brown tracking-tight',
  titleLg: 'font-ibm-bold text-[48px] text-brown tracking-tight',
  title: 'font-ibm-bold text-3xl text-brown',
  subtitle: 'font-ibm-semibold text-xl text-brown',

  // 본문
  heading: 'font-ibm-semibold text-lg text-brown',
  body: 'font-ibm-regular text-base text-brown/80',
  caption: 'font-ibm-regular text-[13px] text-brown/50',

  // 버튼
  btnLabel: 'font-ibm-bold text-[17px] text-brown',
  btnSocial: 'font-ibm-semibold text-base text-brown',
} as const;
