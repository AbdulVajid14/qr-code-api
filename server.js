
// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();

// const allowedOrigins = [
//   process.env.BASE_URL,
//   "https://qr-code-seven-ebon.vercel.app",
// ].filter(Boolean);

// const corsOptions = {
//   origin: function (origin, callback) {
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

// app.use(cors(corsOptions));
// app.use(express.json());

// // MongoDB connection
// await mongoose.connect(process.env.MONGODB_URI);
// console.log("Connected to MongoDB Atlas");

// // QR Code Schema
// const qrCodeSchema = new mongoose.Schema(
//   {
//     qr_key: { type: String, required: true, unique: true },
//     name:   { type: String, required: true },
//     destination: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// const QRCode = mongoose.model("QRCode", qrCodeSchema);

// // CREATE QR
// app.post("/api/qr", async (req, res) => {
//   const { name, destination } = req.body;

//   const qrKey = Math.random().toString(36).substring(2, 10);

//   await QRCode.create({ qr_key: qrKey, name, destination });

//   res.json({
//     success: true,
//     qrUrl: `${process.env.BASE_URL}/qr/${qrKey}`,
//   });
// });

// // GET ALL QR
// app.get("/api/qr", async (req, res) => {
//   const qrCodes = await QRCode.find();
//   res.json(qrCodes);
// });

// // UPDATE DESTINATION
// app.put("/api/qr/:key", async (req, res) => {
//   const { key } = req.params;
//   const { destination } = req.body;

//   await QRCode.findOneAndUpdate({ qr_key: key }, { destination });

//   res.json({ success: true });
// });

// // REDIRECT
// app.get("/qr/:key", async (req, res) => {
//   const { key } = req.params;

//   const qr = await QRCode.findOne({ qr_key: key });

//   if (!qr) {
//     return res.status(404).send("QR Not Found");
//   }

//   res.redirect(qr.destination);
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

const allowedOrigins = [
  process.env.BASE_URL,
  "https://qr-code-seven-ebon.vercel.app",
].filter(Boolean);

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

await mongoose.connect(process.env.MONGODB_URI);
console.log("Connected to MongoDB Atlas");

// ─── Schema ──────────────────────────────────────────────────────────────────
const qrCodeSchema = new mongoose.Schema(
  {
    qr_key: { type: String, required: true, unique: true },
    name: { type: String, required: true },

    // "website" | "contact" | "email" | "maps"
    type: { type: String, required: true, default: "website" },

    // WEBSITE type
    destination: { type: String, default: "" },

    // EMAIL type
    email_to: { type: String, default: "" },
    email_subject: { type: String, default: "" },
    email_body: { type: String, default: "" },

    // MAPS type
    maps_link: { type: String, default: "" },
    maps_label: { type: String, default: "" },

    // CONTACT type (vCard)
    contact: {
      first_name: { type: String, default: "" },
      last_name: { type: String, default: "" },
      phone_personal: { type: String, default: "" },
      phone_work: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
      location: { type: String, default: "" },         // full address
      maps_link: { type: String, default: "" },        // google maps URL
      blood_group: { type: String, default: "" },
      organization: { type: String, default: "" },
      job_title: { type: String, default: "" },
      birthday: { type: String, default: "" },         // YYYY-MM-DD
      notes: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const QRCode = mongoose.model("QRCode", qrCodeSchema);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the URL that the QR should encode */
function buildQrPayload(doc) {
  const base = process.env.BASE_URL;

  switch (doc.type) {
    case "website":
      // QR → redirect page → destination
      return `${base}/qr/${doc.qr_key}`;

    case "email":
      // Direct mailto link (no redirect needed for simple email)
      return `${base}/qr/${doc.qr_key}`;

    case "maps":
      return `${base}/qr/${doc.qr_key}`;

    case "contact":
      // vCard download endpoint
      return `${base}/qr/${doc.qr_key}`;

    default:
      return `${base}/qr/${doc.qr_key}`;
  }
}

/** Generate vCard 3.0 string */
function buildVCard(c, name) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.first_name} ${c.last_name}`.trim(),
    `N:${c.last_name};${c.first_name};;;`,
  ];
  if (c.organization) lines.push(`ORG:${c.organization}`);
  if (c.job_title) lines.push(`TITLE:${c.job_title}`);
  if (c.phone_personal) lines.push(`TEL;TYPE=CELL:${c.phone_personal}`);
  if (c.phone_work) lines.push(`TEL;TYPE=WORK:${c.phone_work}`);
  if (c.email) lines.push(`EMAIL:${c.email}`);
  if (c.website) lines.push(`URL:${c.website}`);
  if (c.location) lines.push(`ADR;TYPE=HOME:;;${c.location};;;;`);
  if (c.birthday) lines.push(`BDAY:${c.birthday.replace(/-/g, "")}`);
  if (c.blood_group) lines.push(`NOTE:Blood Group: ${c.blood_group}${c.notes ? " | " + c.notes : ""}`);
  else if (c.notes) lines.push(`NOTE:${c.notes}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// CREATE QR
app.post("/api/qr", async (req, res) => {
  try {
    const { name, type = "website", ...rest } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: "name and type are required" });
    }

    const qr_key = Math.random().toString(36).substring(2, 10);

    const doc = await QRCode.create({ qr_key, name, type, ...rest });

    res.json({
      success: true,
      qr_key,
      qrUrl: buildQrPayload(doc),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ALL
app.get("/api/qr", async (req, res) => {
  try {
    const list = await QRCode.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ONE
app.get("/api/qr/:key", async (req, res) => {
  try {
    const doc = await QRCode.findOne({ qr_key: req.params.key });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE
app.put("/api/qr/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const updates = req.body;

    const doc = await QRCode.findOneAndUpdate(
      { qr_key: key },
      { $set: updates },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Not found" });

    res.json({ success: true, qrUrl: buildQrPayload(doc) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
app.delete("/api/qr/:key", async (req, res) => {
  try {
    await QRCode.findOneAndDelete({ qr_key: req.params.key });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REDIRECT / SERVE ────────────────────────────────────────────────────────
app.get("/qr/:key", async (req, res) => {
  try {
    const doc = await QRCode.findOne({ qr_key: req.params.key });
    if (!doc) return res.status(404).send("QR code not found.");

    switch (doc.type) {
      case "website":
        return res.redirect(doc.destination || "/");

      case "email": {
        const params = new URLSearchParams();
        if (doc.email_subject) params.set("subject", doc.email_subject);
        if (doc.email_body) params.set("body", doc.email_body);
        const qs = params.toString() ? `?${params.toString()}` : "";
        return res.redirect(`mailto:${doc.email_to}${qs}`);
      }

      case "maps":
        return res.redirect(doc.maps_link || "/");

      case "contact": {
        const vcard = buildVCard(doc.contact || {}, doc.name);
        res.setHeader("Content-Type", "text/vcard; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${doc.contact?.first_name || "contact"}.vcf"`
        );
        return res.send(vcard);
      }

      default:
        return res.redirect(doc.destination || "/");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});