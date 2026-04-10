// @ts-nocheck
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export const db = {
  user: {
    findUnique: async ({ where }) => {
      const rows = await sql`SELECT * FROM "User" WHERE "email" = ${where.email} LIMIT 1`;
      return rows[0] || null;
    },
    create: async ({ data }) => {
      const id = Math.random().toString(36).slice(2, 27);
      const rows = await sql`
        INSERT INTO "User" ("id", "name", "email", "password", "createdAt", "updatedAt")
        VALUES (${id}, ${data.name}, ${data.email}, ${data.password}, NOW(), NOW())
        RETURNING *`;
      return rows[0];
    },
  },
  board: {
    findMany: async ({ where }) => {
      const userId = where?.OR?.[0]?.ownerId || where?.ownerId;
      const rows = await sql`
        SELECT b.*, u."name" as owner_name, u."image" as owner_image,
          (SELECT COUNT(*) FROM "BoardMember" WHERE "boardId" = b."id") as member_count
        FROM "Board" b
        LEFT JOIN "User" u ON b."ownerId" = u."id"
        LEFT JOIN "BoardMember" bm ON b."id" = bm."boardId"
        WHERE b."ownerId" = ${userId} OR bm."userId" = ${userId}
        GROUP BY b."id", u."name", u."image"
        ORDER BY b."updatedAt" DESC`;
      return rows.map((r) => ({
        ...r,
        owner: { name: r.owner_name, image: r.owner_image },
        _count: { members: Number(r.member_count) },
      }));
    },
    findFirst: async ({ where }) => {
      const rows = await sql`SELECT * FROM "Board" WHERE "id" = ${where.id} LIMIT 1`;
      return rows[0] || null;
    },
    create: async ({ data }) => {
      const id = Math.random().toString(36).slice(2, 27);
      const rows = await sql`
        INSERT INTO "Board" ("id", "name", "ownerId", "createdAt", "updatedAt")
        VALUES (${id}, ${data.name}, ${data.ownerId}, NOW(), NOW())
        RETURNING *`;
      if (data.members?.create) {
        const mId = Math.random().toString(36).slice(2, 27);
        await sql`
          INSERT INTO "BoardMember" ("id", "boardId", "userId", "role", "joinedAt")
          VALUES (${mId}, ${id}, ${data.members.create.userId}, ${data.members.create.role}, NOW())`;
      }
      return rows[0];
    },
    updateMany: async ({ where, data }) => {
      if (data.name !== undefined) {
        await sql`UPDATE "Board" SET "name" = ${data.name}, "updatedAt" = NOW() WHERE "id" = ${where.id}`;
      }
      return { count: 1 };
    },
    deleteMany: async ({ where }) => {
      await sql`DELETE FROM "Board" WHERE "id" = ${where.id} AND "ownerId" = ${where.ownerId}`;
      return { count: 1 };
    },
  },
};