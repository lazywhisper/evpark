import type { SourceName } from "../database/schema";
import type { Rates } from "../lib/rates";

export type RawPhoto = { url: string; width?: number; height?: number };

export type NormalizedListing = {
  source: SourceName;
  sourceId: string;
  url: string;
  title: string;
  priceUsd: number | null;
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

export type ListingDetail = {
  description: string | null;
  vin: string | null;
  phoneNorm: string | null;
  region: string | null;
  extraPhotos: RawPhoto[];
};

export interface SourceParser {
  readonly source: SourceName;
  scan(opts: {
    cursor?: string;
    mode: "daily" | "bootstrap";
    rates: Rates;
  }): Promise<ScanResult>;
  /**
   * Fetch the full detail page for a listing — used during scoring to get
   * the full description (list-page bodies are usually truncated/missing).
   * Returns null if detail fetching is not supported or failed.
   */
  fetchDetail?(sourceId: string, url: string): Promise<ListingDetail | null>;
}
