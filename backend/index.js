import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { pool, initDB } from "./db.js";
import { EULA_EN, EULA_RU } from "./eula_fragments.js";

import "./bot.js";
import "./watcher.js";
import "./post_end_watcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await initDB();

const app = express();
app.use(express.json());

// ---------- STATIC FRONTEND ----------
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ---------- API: LANGUAGE ----------
app.post("/api/language", async (req, res) => {
  const { language } = req.body;
  if (!language) return res.sendStatus(400);

  // язык храним позже, пока просто принимаем
  res.sendStatus(200);
});

// ---------- API: EULA ----------
app.get("/api/eula", (req, res) => {
  const lang = req.query.lang;
  if (lang === "ru") return res.send(EULA_RU);
  return res.send(EULA_EN);
});

// ---------- API: TIMER ----------
app.get("/api/timer", async (req, res) => {
  // ВРЕМЕННО: фиксированное значение
  // потом будет из БД
  const tenHours = 10 * 60 * 60;

  res.json({
    remaining: tenHours
  });
});

// ---------- START ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("COUNTDOWN SERVER RUNNING ON", PORT);
});
