const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

export function formatDate(date: string): string {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${WEEKDAYS[d.getDay()]}, ${day} ${MONTHS[month - 1]}`;
}

export function formatDateWithPreposition(date: string): string {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${WEEKDAYS[d.getDay()]}, ${day} de ${MONTHS[month - 1]}`;
}
