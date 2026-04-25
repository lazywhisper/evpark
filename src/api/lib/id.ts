export function newId(prefix = ""): string {
  const r = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(r)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return prefix ? `${prefix}_${hex}` : hex;
}
