import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import productRouter from "./routes/productRoutes.js";
import stockRouter from "./routes/stockRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import { requireAuth } from "./middlewares/authMiddleware.js";

const app: express.Application = express();

app.all("/api/auth/{*any}", toNodeHandler(auth)); 
app.use(express.json());

app.use(requireAuth); 
app.use("/products", productRouter);
app.use("/stock", stockRouter);
app.use("/analytics", analyticsRouter);
app.use("/transactions", transactionRouter);
app.use("/ai", aiRouter);

app.get("/health", (_, res) => {
  res.send("OK");
});


const port = process.env["PORT"] 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});