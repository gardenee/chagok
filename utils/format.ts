export function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function formatAmountShort(n: number): string {
  if (n >= 10000) {
    const man = n / 10000;
    return `${man % 1 === 0 ? Math.floor(man) : man.toFixed(1)}만`;
  }
  if (n >= 1000) return `${Math.floor(n / 1000)}천`;
  return String(n);
}

export function formatAmountShortRounded(n: number): string {
  if (n >= 100000) {
    return `${Math.round(n / 10000)}만`;
  }
  return formatAmountShort(n);
}

export function formatAmountInManwon(n: number): string {
  const manwon = n / 10000;
  if (n >= 100000 || n === 0) {
    return `${Math.round(manwon).toLocaleString('ko-KR')}만원`;
  }
  return `${manwon.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}만원`;
}
