import type { NormalizedListing } from "../parsers/types";

// BMW E39 рестайлинг (facelift) — седан/универсал, выпускался 09.2000–05.2003
// (кузов закончили в 03/2004 для touring, но рестайлингом считается с 09.2000).
// Расширим до 2000-2004 чтобы не упускать пограничные случаи (продавцы часто пишут 2004 для e39 touring).
export const E39_FACELIFT_YEAR_MIN = 2000;
export const E39_FACELIFT_YEAR_MAX = 2004;

const TITLE_HAS_BMW = /\b(bmw|бмв)\b/i;
const TITLE_HAS_E39 = /\(?\be\s*39\b\)?/i;
const TITLE_HAS_5_SERIES =
  /\b(5(\s*-?\s*(серия|серии|сери[ия]|ser|series))|5er|5-?series|пятёрка|пятерка)\b/i;
const E39_MODELS = /\b5(20|23|25|28|30|35|40)\s*(d|i|td)?\b/i;

// Источники мы фильтруем по поколению на стороне URL (онлайнер: gen=6264;
// kufar: slug bmw-5-serii-iv-e39-restajling), поэтому isLikelyE39 — это
// sanity-check от мусора, а не строгий гейт. Если найдены явные признаки
// E39 — пропускаем; если данных мало — не режем.
export function isLikelyE39(l: NormalizedListing): boolean {
  const t = `${l.title} ${l.description ?? ""}`;
  // явные сигналы кузова
  if (TITLE_HAS_E39.test(t)) return true;
  // BMW + (5 series OR модель) + год в окне → точно
  if (TITLE_HAS_BMW.test(t) && (TITLE_HAS_5_SERIES.test(t) || E39_MODELS.test(t))) {
    if (l.year == null || (l.year >= 1995 && l.year <= 2004)) return true;
  }
  // источник уже отфильтровал по поколению — год покрывает окно E39 → пропускаем
  if (l.year != null && l.year >= 1995 && l.year <= 2004) return true;
  return false;
}

export function isFacelift(l: NormalizedListing): boolean {
  if (l.year == null) return false;
  return l.year >= E39_FACELIFT_YEAR_MIN && l.year <= E39_FACELIFT_YEAR_MAX;
}
