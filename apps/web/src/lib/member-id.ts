export function formatMemberId(id: string): string {
  if (id.length !== 8) return id;
  return `${id.slice(0, 4)}-${id.slice(4)}`;
}
