import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app: express.Application = express();

app.all("/api/auth/{*any}", toNodeHandler(auth)); 
app.use(express.json());


app.get("/health", (_, res) => {
  res.send("OK");
});

export default app;