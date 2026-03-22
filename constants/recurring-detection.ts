export const AMOUNT_TOLERANCE = 0.1; // 10% 오차 허용
export const DATE_TOLERANCE_DAYS = 2; // ±2일 오차 허용

// 변동성 소비 카테고리 키워드 — 해당 키워드가 포함된 카테고리는 고정지출 감지 제외
export const VARIABLE_CATEGORY_KEYWORDS = [
  '식재료',
  '식비',
  '외식',
  '카페',
  '커피',
  '군것질',
  '술',
  '유흥',
  '여행',
  '쇼핑',
  '패션',
  '음식',
  '먹거리',
  '배달',
  '음료',
];

export function isVariableCategory(categoryName: string): boolean {
  return VARIABLE_CATEGORY_KEYWORDS.some(kw => categoryName.includes(kw));
}

export function isWithinAmountTolerance(
  base: number,
  compare: number,
): boolean {
  if (base === 0) return false;
  return Math.abs(base - compare) / base <= AMOUNT_TOLERANCE;
}

export function isWithinDateTolerance(
  baseDay: number,
  compareDay: number,
): boolean {
  return Math.abs(baseDay - compareDay) <= DATE_TOLERANCE_DAYS;
}
