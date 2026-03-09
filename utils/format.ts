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
