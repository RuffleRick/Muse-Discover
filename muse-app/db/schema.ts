import {sqliteTable,text,primaryKey} from "drizzle-orm/sqlite-core";
export const pins=sqliteTable("muse_pins",{
 ownerId:text("owner_id").notNull(),
 ideaId:text("idea_id").notNull(),
 payload:text("payload").notNull(),
 note:text("note").notNull().default(""),
 createdAt:text("created_at").notNull()
},t=>[primaryKey({columns:[t.ownerId,t.ideaId]})]);
