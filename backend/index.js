import api from "./api.js";
import express from "express";
import { initDB } from "./db.js";

await initDB();

import "./bot.js";
import "./watcher.js";
import "./post_end_watcher.js";

const app = express();

app.use(express.json());
app.use(express.static("frontend"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("COUNTDOWN SERVER RUNNING");
});

