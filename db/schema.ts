import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  email: text("email").unique(),
  hashed_password: text("hashed_password"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey(),
  expires_at: integer("expires_at"),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
});
