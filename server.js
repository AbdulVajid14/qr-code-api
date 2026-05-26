import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// CREATE QR
app.post("/api/qr", async (req, res) => {
  const { name, destination } = req.body;

  const qrKey = Math.random().toString(36).substring(2, 10);

  await db.query(
    "INSERT INTO qrcodes (qr_key, name, destination) VALUES (?, ?, ?)",
    [qrKey, name, destination]
  );

  res.json({
    success: true,
    qrUrl: `${process.env.BASE_URL}/qr/${qrKey}`,
  });
});

// GET ALL QR
app.get("/api/qr", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM qrcodes");

  res.json(rows);
});

// UPDATE DESTINATION
app.put("/api/qr/:key", async (req, res) => {
  const { key } = req.params;
  const { destination } = req.body;

  await db.query(
    "UPDATE qrcodes SET destination=? WHERE qr_key=?",
    [destination, key]
  );

  res.json({ success: true });
});

// REDIRECT
app.get("/qr/:key", async (req, res) => {
  const { key } = req.params;

  const [rows] = await db.query(
    "SELECT * FROM qrcodes WHERE qr_key=?",
    [key]
  );

  if (!rows.length) {
    return res.status(404).send("QR Not Found");
  }

  res.redirect(rows[0].destination);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});