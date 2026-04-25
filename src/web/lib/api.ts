export type Listing = {
  id: string;
  source: "av" | "onliner" | "abw" | "kufar";
  url: string;
  title: string;
  priceEur: number | null;
  priceRaw: string | null;
  year: number | null;
  mileageKm: number | null;
  region: string | null;
  bodyColor: string | null;
  transmission: string | null;
  vin: string | null;
  description: string | null;
  firstSeenAt: number;
  lastSeenAt: number;
  status: "active" | "sold" | "removed";
};

export type VisionFindings = {
  // legacy
  rust?: number;
  interior?: number;
  originality?: number;
  defects?: string[];
  redFlags?: string[];
  // new
  mPackage?: boolean;
  wheelsModel?: string | null;
  wheelsCategory?: "oem" | "m_oem" | "aftermarket" | "steel" | "unknown";
  wheelsConfidence?: number;
  seatsCondition?: number;
  originalityVisible?: number;
  notes?: string | null;
};

export type TextFindings = {
  ownershipDuration?: "long" | "short" | "unknown";
  ownersCount?: number | null;
  rustMentioned?: boolean;
  workDone?: string[];
  workNeeded?: string[];
  mileageHonesty?: "honest" | "suspicious" | "unknown";
  exchange?: boolean;
  urgency?: boolean;
  abroad?: boolean;
  polishUp?: boolean;
  bodyConditionFromText?: number;
  keyQuotes?: string[];
};

export type Scoring = {
  listingId: string;
  overallScore: number;
  visionScore: number | null;
  textScore: number | null;
  visionFindingsJson: VisionFindings | null;
  textFindingsJson: TextFindings | null;
  sellerType: "caring_owner" | "flipper" | "concealer" | "unknown" | null;
  redFlagsJson: string[] | null;
  scoredAt: number;
};

export type Photo = {
  id: string;
  listingId: string;
  url: string;
  r2Key: string | null;
  phash: string | null;
  width: number | null;
  height: number | null;
  orderIdx: number;
};

export type ListingRow = { l: Listing; s: Scoring | null; thumbUrl: string | null };

const base = "/api";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchListings(minScore = 0, limit = 500) {
  return jsonFetch<{ listings: ListingRow[] }>(`/listings?minScore=${minScore}&limit=${limit}`);
}

export async function fetchListing(id: string) {
  return jsonFetch<{ listing: Listing; scoring: Scoring | null; photos: Photo[] }>(
    `/listings/${id}`,
  );
}

export type Notification = {
  id: string;
  listingId: string;
  tgChatId: string;
  sentAt: number;
  reaction: "up" | "down" | null;
  listingTitle: string | null;
  listingUrl: string | null;
  listingPriceEur: number | null;
};
export async function fetchNotifications() {
  return jsonFetch<{ notifications: Notification[] }>(`/notifications`);
}
