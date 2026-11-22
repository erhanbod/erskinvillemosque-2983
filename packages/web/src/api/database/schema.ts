import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Last-known-good copy of the Diyanet prayer feed. The TV board reads through
 * this cache so an upstream outage never leaves the screen empty.
 */
export const prayerCache = sqliteTable("prayer_cache", {
  key: text("key").primaryKey(),
  payload: text("payload").notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
