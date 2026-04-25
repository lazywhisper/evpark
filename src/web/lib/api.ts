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
  vin: string | null;
  description: string | null;
  firstSeenAt: number;
  lastSeenAt: number;
  status: "active" | "sold" | "removed";
};

export type Scoring = {
  listingId: string;
  overallScore: number;
  visionScore: number | null;
  textScore: number | null;
  visionFindingsJson: {
    rust: number;
    interior: number;
    originality: number;
    defects: string[];
    redFlags: string[];
    notes?: string;
  } | null;
  sellerType: "caring_owner" | "flipper" | "concealer" | "unknown" | null;
  redFlagsJson: string[] | null;
  scoredAt: number;
};

export type ListingRow = { l: Listing; s: Scoring | null };

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

export async function fetchListings(minScore = 0, limit = 100) {
  return jsonFetch<{ listings: ListingRow[] }>(`/listings?minScore=${minScore}&limit=${limit}`);
}

export async function fetchListing(id: string) {
  return jsonFetch<{ listing: Listing; scoring: Scoring | null }>(`/listings/${id}`);
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
