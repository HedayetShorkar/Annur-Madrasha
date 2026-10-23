// server.js — শিক্ষকের লগইন + ক্লাসের তালিকা + Jitsi JWT
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");

const {
  PORT = 4000,
  FRONTEND_ORIGIN = "http://localhost:5173",
  AUTH_SECRET,            // শিক্ষকের লগইন টোকেনের গোপন কী
  TEACHER_SIGNUP_CODE,    // শিক্ষক হিসেবে রেজিস্টার করতে এই কোড লাগবে
  JITSI_DOMAIN,           // যেমন meet.example.com
  JITSI_APP_ID,           // Jitsi-তে যেটা app_id দিয়েছেন
  JITSI_APP_SECRET,       // Jitsi-তে যেটা app_secret দিয়েছেন
} = process.env;

for (const [k, v] of Object.entries({
  AUTH_SECRET, TEACHER_SIGNUP_CODE, JITSI_DOMAIN, JITSI_APP_ID, JITSI_APP_SECRET,
})) {
  if (!v) { console.error(`.env-এ ${k} দেওয়া নেই`); process.exit(1); }
}

// ---------- ডেটাবেস ----------
const db = new Database("classes.db");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  room TEXT NOT NULL UNIQUE,
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// ---------- হেল্পার ----------
const slugify = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "class";

const newRoom = (title) => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `${slugify(title).slice(0, 30)}-${code}`;
};

const signAuth = (teacher) =>
  jwt.sign({ id: teacher.id, name: teacher.name }, AUTH_SECRET, { expiresIn: "7d" });

function jitsiToken({ room, name, moderator }) {
  return jwt.sign(
    {
      aud: JITSI_APP_ID,
      iss: JITSI_APP_ID,
      sub: JITSI_DOMAIN,
      room,
      context: { user: { name, moderator: moderator ? "true" : "false" } },
    },
    JITSI_APP_SECRET,
    { algorithm: "HS256", expiresIn: "6h" }
  );
}

function requireTeacher(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "লগইন করা নেই" });
  try {
    req.teacher = jwt.verify(token, AUTH_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "লগইনের মেয়াদ শেষ, আবার লগইন করুন" });
  }
}

// ---------- অ্যাপ ----------
const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// শিক্ষক রেজিস্টার (শুধু signup code জানা থাকলে)
app.post("/api/auth/register", authLimiter, (req, res) => {
  const { name, email, password, signupCode } = req.body || {};
  if (signupCode !== TEACHER_SIGNUP_CODE)
    return res.status(403).json({ error: "রেজিস্ট্রেশন কোড ভুল" });
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: "নাম, ইমেইল ও কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন" });

  const exists = db.prepare("SELECT id FROM teachers WHERE email = ?").get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: "এই ইমেইল আগেই ব্যবহার হয়েছে" });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO teachers (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name.trim(), email.toLowerCase(), hash);
  const teacher = { id: info.lastInsertRowid, name: name.trim() };
  res.status(201).json({ token: signAuth(teacher), teacher });
});

// শিক্ষক লগইন
app.post("/api/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const row = db.prepare("SELECT * FROM teachers WHERE email = ?").get((email || "").toLowerCase());
  if (!row || !bcrypt.compareSync(password || "", row.password_hash))
    return res.status(401).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" });
  const teacher = { id: row.id, name: row.name };
  res.json({ token: signAuth(teacher), teacher });
});

// নতুন ক্লাস তৈরি
app.post("/api/classes", requireTeacher, (req, res) => {
  const { title, scheduledAt } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "ক্লাসের নাম দিন" });
  const room = newRoom(title);
  const info = db
    .prepare("INSERT INTO classes (teacher_id, title, room, scheduled_at) VALUES (?, ?, ?, ?)")
    .run(req.teacher.id, title.trim(), room, scheduledAt || null);
  res.status(201).json({ id: info.lastInsertRowid, title: title.trim(), room, scheduledAt: scheduledAt || null });
});

// নিজের ক্লাসের তালিকা
app.get("/api/classes", requireTeacher, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, title, room, scheduled_at AS scheduledAt, created_at AS createdAt
       FROM classes WHERE teacher_id = ? ORDER BY COALESCE(scheduled_at, created_at) DESC`
    )
    .all(req.teacher.id);
  res.json(rows);
});

// ক্লাস মুছে ফেলা
app.delete("/api/classes/:id", requireTeacher, (req, res) => {
  const info = db
    .prepare("DELETE FROM classes WHERE id = ? AND teacher_id = ?")
    .run(req.params.id, req.teacher.id);
  if (!info.changes) return res.status(404).json({ error: "ক্লাস পাওয়া যায়নি" });
  res.json({ ok: true });
});

// ছাত্র: লিংক দিয়ে ঢোকা (লগইন লাগে না, মডারেটর হবে না)
app.get("/api/join/:room", (req, res) => {
  const cls = db.prepare("SELECT title, room FROM classes WHERE room = ?").get(req.params.room);
  if (!cls) return res.status(404).json({ error: "এই ক্লাস পাওয়া যায়নি" });
  const name = (req.query.name || "").toString().trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: "নাম দিন" });
  res.json({
    title: cls.title,
    domain: JITSI_DOMAIN,
    room: cls.room,
    jwt: jitsiToken({ room: cls.room, name, moderator: false }),
  });
});

// শিক্ষক: নিজের ক্লাসে মডারেটর হিসেবে ঢোকা
app.get("/api/join/:room/teacher", requireTeacher, (req, res) => {
  const cls = db
    .prepare("SELECT title, room, teacher_id FROM classes WHERE room = ?")
    .get(req.params.room);
  if (!cls) return res.status(404).json({ error: "এই ক্লাস পাওয়া যায়নি" });
  if (cls.teacher_id !== req.teacher.id)
    return res.status(403).json({ error: "এটা আপনার ক্লাস নয়" });
  res.json({
    title: cls.title,
    domain: JITSI_DOMAIN,
    room: cls.room,
    jwt: jitsiToken({ room: cls.room, name: req.teacher.name, moderator: true }),
  });
});

app.listen(PORT, () => console.log(`সার্ভার চলছে: http://localhost:${PORT}`));
