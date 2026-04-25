import type { SourceName } from "../database/schema";

export type RawPhoto = { url: string; width?: number; height?: number };

export type NormalizedListing = {
  source: SourceName;
  sourceId: string;
  url: string;
  title: string;
  priceEur: number | null;
  priceRaw: string | null;
  currencyRaw: string | null;
  year: number | null;
  mileageKm: number | null;
  transmission: string | null;
  bodyColor: string | null;
  region: string | null;
  vin: string | null;
  phoneNorm: string | null;
  description: string | null;
  photos: RawPhoto[];
  raw: unknown;
};

export type ScanResult = {
  listings: NormalizedListing[];
  nextCursor: string | null;
};

export interface SourceParser {
  readonly source: SourceName;
  scan(opts: { cursor?: string; mode: "daily" | "bootstrap" }): Promise<ScanResult>;
}
