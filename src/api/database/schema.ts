import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// === Better Auth =============================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// === Domain ==================================================================

export type SourceName = "av" | "onliner" | "abw" | "kufar";

export const sources = sqliteTable("sources", {
  name: text("name").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  lastRunAt: integer("last_run_at", { mode: "timestamp_ms" }),
  rateLimitRpm: integer("rate_limit_rpm").notNull().default(30),
});

export type DedupSignals = {
  vin?: string;
  phoneNorm?: string;
  phashes?: string[];
  fuzzyKey?: string;
};

export const dedupClusters = sqliteTable("dedup_clusters", {
  id: text("id").primaryKey(),
  canonicalListingId: text("canonical_listing_id").notNull(),
  signalsJson: text("signals_json", { mode: "json" }).notNull().$type<DedupSignals>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const listings = sqliteTable(
  "listings",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull().$type<SourceName>(),
    sourceId: text("source_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    priceUsd: real("price_usd"),
    priceRaw: text("price_raw"),
    currencyRaw: text("currency_raw"),
    year: integer("year"),
    mileageKm: integer("mileage_km"),
    transmission: text("transmission"),
    bodyColor: text("body_color"),
    region: text("region"),
    vin: text("vin"),
    phoneNorm: text("phone_norm"),
    description: text("description"),
    rawJson: text("raw_json", { mode: "json" }),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    status: text("status").notNull().default("active").$type<"active" | "sold" | "removed">(),
    dedupClusterId: text("dedup_cluster_id").references(() => dedupClusters.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    sourceIdUq: uniqueIndex("listings_source_source_id_uq").on(t.source, t.sourceId),
    clusterIdx: index("listings_cluster_idx").on(t.dedupClusterId),
    vinIdx: index("listings_vin_idx").on(t.vin),
    phoneIdx: index("listings_phone_idx").on(t.phoneNorm),
    statusIdx: index("listings_status_idx").on(t.status),
  }),
);

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    r2Key: text("r2_key"),
    phash: text("phash"),
    width: integer("width"),
    height: integer("height"),
    orderIdx: integer("order_idx").notNull().default(0),
  },
  (t) => ({
    phashIdx: index("photos_phash_idx").on(t.phash),
    listingIdx: index("photos_listing_idx").on(t.listingId),
  }),
);

// Новые findings (после рефокуса): Vision видит только M-package + диски + сидения,
// тексты тащит rust mention, ownership, work done/needed.
// Старые записи могут содержать legacy { rust, interior, originality } —
// фронт должен уметь обе формы.
export type VisionFindings = {
  // legacy (до 2026-04)
  rust?: number;
  interior?: number;
  originality?: number;
  defects?: string[];
  redFlags?: string[];
  // новые
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

export const scoring = sqliteTable("scoring", {
  listingId: text("listing_id")
    .primaryKey()
    .references(() => listings.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  visionScore: integer("vision_score"),
  textScore: integer("text_score"),
  visionFindingsJson: text("vision_findings_json", { mode: "json" }).$type<VisionFindings>(),
  textFindingsJson: text("text_findings_json", { mode: "json" }).$type<TextFindings>(),
  sellerType: text("seller_type").$type<"caring_owner" | "flipper" | "concealer" | "unknown">(),
  redFlagsJson: text("red_flags_json", { mode: "json" }).$type<string[]>(),
  modelVersion: text("model_version"),
  scoredAt: integer("scored_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  tokensUsed: integer("tokens_used"),
});

export const telegramUsers = sqliteTable("telegram_users", {
  tgChatId: text("tg_chat_id").primaryKey(),
  tgUsername: text("tg_username"),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  threshold: integer("threshold").notNull().default(70),
  language: text("language").notNull().default("ru"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const preferences = sqliteTable("preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  yearMin: integer("year_min").notNull().default(2000),
  yearMax: integer("year_max").notNull().default(2003),
  priceMinEur: real("price_min_eur"),
  priceMaxEur: real("price_max_eur"),
  mileageMaxKm: integer("mileage_max_km"),
  transmissionPref: text("transmission_pref"),
  regionsJson: text("regions_json", { mode: "json" }).$type<string[]>(),
  mustHaveVin: integer("must_have_vin", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const notificationsLog = sqliteTable(
  "notifications_log",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    tgChatId: text("tg_chat_id").notNull(),
    sentAt: integer("sent_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    messageId: integer("message_id"),
    reaction: text("reaction").$type<"up" | "down" | null>(),
    reactionAt: integer("reaction_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    chatSentIdx: index("notif_chat_sent_idx").on(t.tgChatId, t.sentAt),
    listingChatUq: uniqueIndex("notif_listing_chat_uq").on(t.listingId, t.tgChatId),
  }),
);

export const reactionFeatures = sqliteTable("reaction_features", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  reaction: text("reaction").notNull().$type<"up" | "down">(),
  snapshotJson: text("snapshot_json", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const fetchRuns = sqliteTable("fetch_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull().$type<SourceName>(),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  pagesFetched: integer("pages_fetched").notNull().default(0),
  listingsNew: integer("listings_new").notNull().default(0),
  listingsUpdated: integer("listings_updated").notNull().default(0),
  errorsJson: text("errors_json", { mode: "json" }),
});

export const phashCache = sqliteTable(
  "phash_cache",
  {
    phash: text("phash").notNull(),
    visionFindingsJson: text("vision_findings_json", { mode: "json" }).$type<VisionFindings>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.phash] }),
  }),
);
