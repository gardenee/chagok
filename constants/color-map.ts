export const COLOR_MAP: Record<string, string> = {
  'baby-pink': '#FFCCD5',
  pink: '#F0C5D5',
  peach: '#F7B8A0',
  'light-peach': '#FFD4B8',
  coral: '#F4A0A0',
  rose: '#E8A0C0',
  lilac: '#EAD8FC',
  lavender: '#D4C5F0',
  violet: '#C5A8E8',
  'purple-light': '#C8B8F0',
  periwinkle: '#C8D8F8',
  'sky-blue': '#B5C8E8',
  cyan: '#A0D8E8',
  'light-blue': '#B8E0F0',
  mint: '#A8D8B0',
  'light-mint': '#B8E8C8',
  sage: '#C5E8D5',
  lime: '#D0E8B5',
  butter: '#FAD97A',
  'pale-yellow': '#FFE8A0',
  apricot: '#F5D0A0',
  amber: '#F5C070',
};

/** color key 또는 기존 hex 값 모두 hex로 변환 */
export function resolveColor(colorOrKey: string): string {
  return COLOR_MAP[colorOrKey] ?? colorOrKey;
}
