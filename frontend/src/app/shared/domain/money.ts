//"1 250,00 zł": a space between every three digits (also for four-digit amounts), a comma before the grosze
export function formatPln(amount: number): string {
  const [integer, grosze] = Math.abs(amount).toFixed(2).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${amount < 0 ? '-' : ''}${grouped},${grosze} zł`;
}
