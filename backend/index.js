import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { initDB } from "./db.js";
import "./bot.js";
import "./watcher.js";
import "./post_end_watcher.js";
import api from "./api.js";

/* ================== PATH FIX ================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================== INIT DB ================== */
await initDB();

/* ================== EXPRESS ================== */
const app = express();

app.use(express.json());

/* ================== API ================== */
app.use("/api", api);

/* ================== FRONTEND ================== */
app.use(
  express.static(
    path.join(__dirname, "../frontend")
  )
);

/* ================== ROOT ================== */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

/* ================== START ================== */
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("COUNTDOWN SERVER RUNNING");
});
