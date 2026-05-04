const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const MEMBER_ID_LENGTH = 8;

export function generateMemberId(): string {
  const bytes = new Uint8Array(MEMBER_ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < MEMBER_ID_LENGTH; i++) {
    out += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return out;
}

export function formatMemberId(id: string): string {
  if (id.length !== MEMBER_ID_LENGTH) return id;
  return `${id.slice(0, 4)}-${id.slice(4)}`;
}
