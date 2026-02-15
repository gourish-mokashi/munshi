import "dotenv/config";
import express from "express";

const app = express();

app.get("/health", (_, res) => {
  res.send("OK");
});

const port = process.env["PORT"] 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});