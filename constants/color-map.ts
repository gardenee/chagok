export const COLOR_MAP: Record<string, string> = {
  butter: '#FAD97A',
  olive: '#A3B18A',
  lavender: '#B8A3DE',
  peach: '#FFADAD',
  rose: '#F28482',
  crimson: '#E56B6F',
  strawberry: '#FF85A1',
  apricot: '#FBC4AB',
  coral: '#F4A261',
  sunset: '#E76F51',
  honey: '#EEB462',
  lemon: '#FFF3B0',
  mint: '#95D5B2',
  sky: '#A2D2FF',
  orchid: '#DEABFF',
  beige: '#DDB892',
  slate: '#8E9AAF',
  fog: '#CBC0D3',
  'forest-light': '#74A892',
  pistachio: '#C7E9B0',
  seaweed: '#A7C957',
  'ocean-soft': '#8ECAE6',
  mauve: '#B79CED',
  sand: '#E9C891',
  hazel: '#B08968',
  clay: '#B5A4A3',
  mist: '#D6E2E9',
};

/** color key 또는 기존 hex 값 모두 hex로 변환 */
export function resolveColor(colorOrKey: string): string {
  return COLOR_MAP[colorOrKey] ?? colorOrKey;
}

/** hex 값을 color key로 역변환 (없으면 그대로 반환) */
export function resolveColorKey(hexOrKey: string): string {
  const entry = Object.entries(COLOR_MAP).find(([, hex]) => hex === hexOrKey);
  return entry ? entry[0] : hexOrKey;
}
