import "dotenv/config";
import { defineConfig } from "prisma/config";

if(!process.env["DATABASE_URL"]) {
  console.warn("DATABASE_URL environment variable is not set. Please set it to your database connection string.");
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
