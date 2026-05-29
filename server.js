// import express from "express";
// import cors from "cors";
// import mysql from "mysql2/promise";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// const db = await mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// const allowedOrigins = [process.env.BASE_URL].filter(Boolean);

// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like Postman)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };

// // CREATE QR
// app.post("/api/qr", async (req, res) => {
//   const { name, destination } = req.body;

//   const qrKey = Math.random().toString(36).substring(2, 10);

//   await db.query(
//     "INSERT INTO qrcodes (qr_key, name, destination) VALUES (?, ?, ?)",
//     [qrKey, name, destination],
//   );

//   res.json({
//     success: true,
//     qrUrl: `${process.env.BASE_URL}/qr/${qrKey}`,
//   });
// });

// // GET ALL QR
// app.get("/api/qr", async (req, res) => {
//   const [rows] = await db.query("SELECT * FROM qrcodes");

//   res.json(rows);
// });

// // UPDATE DESTINATION
// app.put("/api/qr/:key", async (req, res) => {
//   const { key } = req.params;
//   const { destination } = req.body;

//   await db.query("UPDATE qrcodes SET destination=? WHERE qr_key=?", [
//     destination,
//     key,
//   ]);

//   res.json({ success: true });
// });

// // REDIRECT
// app.get("/qr/:key", async (req, res) => {
//   const { key } = req.params;

//   const [rows] = await db.query("SELECT * FROM qrcodes WHERE qr_key=?", [key]);

//   if (!rows.length) {
//     return res.status(404).send("QR Not Found");
//   }

//   res.redirect(rows[0].destination);
// });

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
// });
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const allowedOrigins = [process.env.BASE_URL].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
await mongoose.connect(process.env.MONGODB_URI);
console.log("Connected to MongoDB Atlas");

// QR Code Schema
const qrCodeSchema = new mongoose.Schema(
  {
    qr_key: { type: String, required: true, unique: true },
    name:   { type: String, required: true },
    destination: { type: String, required: true },
  },
  { timestamps: true }
);

const QRCode = mongoose.model("QRCode", qrCodeSchema);

// CREATE QR
app.post("/api/qr", async (req, res) => {
  const { name, destination } = req.body;

  const qrKey = Math.random().toString(36).substring(2, 10);

  await QRCode.create({ qr_key: qrKey, name, destination });

  res.json({
    success: true,
    qrUrl: `${process.env.BASE_URL}/qr/${qrKey}`,
  });
});

// GET ALL QR
app.get("/api/qr", async (req, res) => {
  const qrCodes = await QRCode.find();
  res.json(qrCodes);
});

// UPDATE DESTINATION
app.put("/api/qr/:key", async (req, res) => {
  const { key } = req.params;
  const { destination } = req.body;

  await QRCode.findOneAndUpdate({ qr_key: key }, { destination });

  res.json({ success: true });
});

// REDIRECT
app.get("/qr/:key", async (req, res) => {
  const { key } = req.params;

  const qr = await QRCode.findOne({ qr_key: key });

  if (!qr) {
    return res.status(404).send("QR Not Found");
  }

  res.redirect(qr.destination);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});