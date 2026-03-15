// startMonthOffset/endMonthOffset: -2=전전월, -1=전월, 0=당월
// endDay: 'last' = 말일
export type BillingPeriod = {
  startMonthOffset: -2 | -1 | 0;
  startDay: number;
  endMonthOffset: -2 | -1 | 0;
  endDay: number | 'last';
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

/**
 * 카드사별 결제일 → 이용기간 계산
 *
 * 패턴 (공식 출처로 확인된 카드사에만 사용):
 *   day < pivotDay  → 전전월 (preOffset+day)일 ~ 전월 (preOffset+day-1)일
 *   day === pivotDay → 전월 1일 ~ 전월 말일
 *   day > pivotDay  → 전월 (day-pivotDay+1)일 ~ 당월 (day-pivotDay)일
 *
 * 확인 출처:
 *   신한카드: shinhancard.com (1187644_1118.html)  pivot=14, preOffset=17
 *   KB국민카드: card.kbcard.com (HSGMCXCRSCSC0044)   pivot=14, preOffset=17
 *   현대카드: hyundaicard.com (MOCUS014700_01.html)   pivot=12, preOffset=19
 *   하나카드: bccard.com/pop_credit_giving_hana.html   pivot=13, preOffset=18
 *   NH농협카드: bccard.com/pop_credit_giving_nh.html  pivot=14, preOffset=17
 */
function buildBillingPeriodsFromPivot(
  days: number[],
  pivotDay: number,
  preOffset: number,
): Record<number, BillingPeriod> {
  return Object.fromEntries(
    days.map(day => {
      let period: BillingPeriod;
      if (day < pivotDay) {
        period = {
          startMonthOffset: -2,
          startDay: preOffset + day,
          endMonthOffset: -1,
          endDay: preOffset + day - 1,
        };
      } else if (day === pivotDay) {
        period = {
          startMonthOffset: -1,
          startDay: 1,
          endMonthOffset: -1,
          endDay: 'last',
        };
      } else {
        period = {
          startMonthOffset: -1,
          startDay: day - pivotDay + 1,
          endMonthOffset: 0,
          endDay: day - pivotDay,
        };
      }
      return [day, period];
    }),
  );
}

const DAYS_1_TO_27 = Array.from({ length: 27 }, (_, i) => i + 1);
const DAYS_1_TO_25 = Array.from({ length: 25 }, (_, i) => i + 1);

export const CREDIT_CARD_COMPANIES: CardCompany[] = [
  {
    // 삼성카드: 결제일 공식 확인 (동적 페이지라 이용기간 직접 확인 불가)
    id: 'samsung',
    name: '삼성카드',
    color: '#B5D0F0',
    availablePaymentDays: [
      1, 5, 10, 11, 12, 13, 14, 15, 18, 21, 22, 23, 24, 25, 26,
    ],
    billingPeriods: {},
  },
  {
    // 신한카드: 공식 확인 (pivot=14, preOffset=17)
    id: 'shinhan',
    name: '신한카드',
    color: '#C0D4F7',
    availablePaymentDays: DAYS_1_TO_27,
    billingPeriods: buildBillingPeriodsFromPivot(DAYS_1_TO_27, 14, 17),
  },
  {
    // KB국민카드: 공식 확인 (pivot=14, preOffset=17)
    id: 'kb',
    name: 'KB국민카드',
    color: '#FFE0A0',
    availablePaymentDays: DAYS_1_TO_27,
    billingPeriods: buildBillingPeriodsFromPivot(DAYS_1_TO_27, 14, 17),
  },
  {
    // 현대카드: 공식 확인 (pivot=12, preOffset=19) / 24·26일은 S카드 전용
    id: 'hyundai',
    name: '현대카드',
    color: '#D0D0D0',
    availablePaymentDays: [1, 5, 10, 12, 15, 20, 23, 24, 25, 26],
    billingPeriods: buildBillingPeriodsFromPivot(
      [1, 5, 10, 12, 15, 20, 23, 24, 25, 26],
      12,
      19,
    ),
  },
  {
    // 롯데카드: 결제일 공식 확인 (이용기간 직접 확인 불가)
    id: 'lotte',
    name: '롯데카드',
    color: '#F7C0C5',
    availablePaymentDays: [1, 5, 7, 10, 14, 15, 17, 20, 21, 22, 23, 24, 25],
    billingPeriods: {},
  },
  {
    // 우리카드: 결제일 공식 확인 (이용기간 직접 확인 불가) / 27일은 기존 고객만
    id: 'woori',
    name: '우리카드',
    color: '#B8D4F0',
    availablePaymentDays: DAYS_1_TO_25,
    billingPeriods: {},
  },
  {
    // 하나카드: 공식 확인 (pivot=13, preOffset=18)
    id: 'hana',
    name: '하나카드',
    color: '#C0E8C0',
    availablePaymentDays: [1, 5, 8, 10, 12, 13, 15, 18, 20, 21, 23, 25, 27],
    billingPeriods: buildBillingPeriodsFromPivot(
      [1, 5, 8, 10, 12, 13, 15, 18, 20, 21, 23, 25, 27],
      13,
      18,
    ),
  },
  {
    // NH농협카드: 공식 확인 (pivot=14, preOffset=17)
    id: 'nh',
    name: 'NH농협카드',
    color: '#C8E8B0',
    availablePaymentDays: DAYS_1_TO_27,
    billingPeriods: buildBillingPeriodsFromPivot(DAYS_1_TO_27, 14, 17),
  },
  {
    // IBK기업카드: 결제일 공식 확인 (이용기간 직접 확인 불가)
    id: 'ibk',
    name: 'IBK기업카드',
    color: '#B0C8E8',
    availablePaymentDays: DAYS_1_TO_27,
    billingPeriods: {},
  },
  {
    // BC카드(바로카드): 결제일 공식 확인 (이용기간 직접 확인 불가)
    id: 'bc',
    name: 'BC카드',
    color: '#F0C0C0',
    availablePaymentDays: [1, 5, 8, 12, 13, 15, 23, 25, 27],
    billingPeriods: {},
  },
  {
    // 카카오뱅크: 신한카드 PLCC이나 이용기간 공식 직접 확인 불가
    id: 'kakaobank',
    name: '카카오뱅크',
    color: '#FFE870',
    availablePaymentDays: DAYS_1_TO_27,
    billingPeriods: {},
  },
];

// 결제일이 지정되지 않았을 때 표시할 일반 결제일 목록
export const DEFAULT_PAYMENT_DAYS = [1, 5, 10, 14, 15, 17, 20, 21, 25, 27];

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

  const monthLabel = (offset: -2 | -1 | 0): string => {
    if (offset === -2) return '전전월';
    if (offset === -1) return '전월';
    return '당월';
  };

  const startStr = `${monthLabel(period.startMonthOffset)} ${period.startDay}일`;
  const endStr =
    period.endDay === 'last'
      ? `${monthLabel(period.endMonthOffset)} 말일`
      : `${monthLabel(period.endMonthOffset)} ${period.endDay}일`;

  return `${startStr} ~ ${endStr} 사용분 청구`;
}
