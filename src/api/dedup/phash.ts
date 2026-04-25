// Простой aHash (average hash) реализованный без canvas — работает на bytes JPEG.
// Точнее dHash требует resize/grayscale; в Workers нет canvas. Используем дешёвый
// "fingerprint" по байтам: SHA-1 первых 4КБ изображения, обрезанный до 16 hex.
// Этого достаточно для сильного сигнала "тот же файл / тот же сжатый JPEG".
// Полноценный perceptual hash планируется через Workers AI image-classification
// или через внешний resize-сервис в будущей итерации.

export async function fingerprint(bytes: Uint8Array): Promise<string> {
  const slice = bytes.slice(0, 4096);
  const hash = await crypto.subtle.digest("SHA-1", slice);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function fingerprintFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { accept: "image/*" } });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    return await fingerprint(buf);
  } catch {
    return null;
  }
}

// Hamming-расстояние между двумя hex-хешами одинаковой длины
export function hamming(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i += 2) {
    const x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    let v = x;
    while (v) {
      dist += v & 1;
      v >>= 1;
    }
  }
  return dist;
}
