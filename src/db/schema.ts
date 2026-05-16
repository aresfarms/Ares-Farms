import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey(),

  userId: uuid("user_id").notNull(),

  name: text("name"),
  address: text("address"),
  city: text("city"),

  state: text("state").notNull(),

  // REQUIRED for your onboarding + regional logic
  county: text("county").notNull(),

  // US regional system (your architecture requirement)
  federalRegion: text("federal_region").notNull(),   // NE, South, Midwest, West
  internalRegion: text("internal_region").notNull(), // your custom grouping layer

  country: text("country").notNull().default("US"),

  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow(),
});
