export type BillingPeriod = {
  startMonthOffset: -1 | 0;
  startDay: number;
  endMonthOffset: -1 | 0;
  endDay: number;
};

export type CardCompany = {
  id: string;
  name: string;
  color: string;
  availablePaymentDays: number[];
  billingPeriods: Record<number, BillingPeriod>;
};

export type BankInfo = {
  id: string;
  name: string;
  color: string;
};

export type TransitProvider = {
  id: string;
  name: string;
  color: string;
};

// 결제일 D → 전월 D+1일 ~ 당월 D일 (한국 신용카드 표준 청구 공식)
// lastVerified: 2025-01 기준. 카드사 정책 변경 시 직접 수정.
function buildBillingPeriods(days: number[]): Record<number, BillingPeriod> {
  return Object.fromEntries(
    days.map(day => [
      day,
      {
        startMonthOffset: -1 as const,
        startDay: day + 1,
        endMonthOffset: 0 as const,
        endDay: day,
      },
    ]),
  );
}

export const CREDIT_CARD_COMPANIES: CardCompany[] = [
  {
    id: 'samsung',
    name: '삼성카드',
    color: '#B5D0F0',
    availablePaymentDays: [5, 10, 14, 15, 17, 20, 25, 27],
    billingPeriods: buildBillingPeriods([5, 10, 14, 15, 17, 20, 25, 27]),
  },
  {
    id: 'shinhan',
    name: '신한카드',
    color: '#C0D4F7',
    availablePaymentDays: [5, 10, 14, 17, 21, 25, 28],
    billingPeriods: buildBillingPeriods([5, 10, 14, 17, 21, 25, 28]),
  },
  {
    id: 'kb',
    name: 'KB국민카드',
    color: '#FFE0A0',
    availablePaymentDays: [5, 10, 14, 17, 21, 25],
    billingPeriods: buildBillingPeriods([5, 10, 14, 17, 21, 25]),
  },
  {
    id: 'hyundai',
    name: '현대카드',
    color: '#D0D0D0',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'lotte',
    name: '롯데카드',
    color: '#F7C0C5',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'woori',
    name: '우리카드',
    color: '#B8D4F0',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'hana',
    name: '하나카드',
    color: '#C0E8C0',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'nh',
    name: 'NH농협카드',
    color: '#C8E8B0',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'ibk',
    name: 'IBK기업카드',
    color: '#B0C8E8',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'bc',
    name: 'BC카드',
    color: '#F0C0C0',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
  {
    id: 'kakaobank',
    name: '카카오뱅크',
    color: '#FFE870',
    availablePaymentDays: [1, 5, 10, 14, 15, 17, 20, 25, 27],
    billingPeriods: buildBillingPeriods([1, 5, 10, 14, 15, 17, 20, 25, 27]),
  },
  {
    id: 'citi',
    name: '씨티카드',
    color: '#C0D0E8',
    availablePaymentDays: [5, 10, 15, 20, 25],
    billingPeriods: buildBillingPeriods([5, 10, 15, 20, 25]),
  },
];

// 결제일이 지정되지 않았을 때 표시할 일반 결제일 목록
export const DEFAULT_PAYMENT_DAYS = [1, 5, 10, 14, 15, 17, 20, 21, 25, 27, 28];

export const DEBIT_CARD_BANKS: BankInfo[] = [
  { id: 'kb', name: 'KB국민', color: '#FFE0A0' },
  { id: 'shinhan', name: '신한', color: '#C0D4F7' },
  { id: 'woori', name: '우리', color: '#B8D4F0' },
  { id: 'hana', name: '하나', color: '#C0E8C0' },
  { id: 'nh', name: 'NH농협', color: '#C8E8B0' },
  { id: 'ibk', name: 'IBK기업', color: '#B0C8E8' },
  { id: 'kakaobank', name: '카카오뱅크', color: '#FFE870' },
  { id: 'tossbank', name: '토스뱅크', color: '#B0C8FF' },
  { id: 'kbank', name: '케이뱅크', color: '#A0E0D8' },
  { id: 'sc', name: 'SC제일', color: '#B8D8E8' },
  { id: 'busan', name: '부산', color: '#D0C8F0' },
  { id: 'daegu', name: '대구', color: '#E8D0C8' },
  { id: 'gwangju', name: '광주', color: '#D0E8C8' },
  { id: 'suhyup', name: '수협', color: '#C0D8F0' },
  { id: 'post', name: '우체국', color: '#F0C8A0' },
  { id: 'other', name: '기타', color: '#D8D8D8' },
];

export const TRANSIT_PROVIDERS: TransitProvider[] = [
  { id: 'tmoney', name: '티머니', color: '#F0B090' },
  { id: 'cashbee', name: '캐시비', color: '#90C8E8' },
  { id: 'nara', name: '나래카드', color: '#F0D880' },
  { id: 'hanpay', name: '한페이', color: '#F0A880' },
];

export function getBillingPeriodLabel(
  company: CardCompany,
  billingDay: number,
): string {
  const period = company.billingPeriods[billingDay];
  if (!period) return '';
  return `전월 ${period.startDay}일 ~ 당월 ${period.endDay}일 사용분 청구`;
}
