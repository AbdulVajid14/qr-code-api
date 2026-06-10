import QRCode from "../models/QRCode.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildVCard(c) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.first_name} ${c.last_name}`.trim(),
    `N:${c.last_name};${c.first_name};;;`,
  ];
  if (c.organization)   lines.push(`ORG:${c.organization}`);
  if (c.job_title)      lines.push(`TITLE:${c.job_title}`);
  if (c.phone_personal) lines.push(`TEL;TYPE=CELL:${c.phone_personal}`);
  if (c.phone_work)     lines.push(`TEL;TYPE=WORK:${c.phone_work}`);
  if (c.email)          lines.push(`EMAIL:${c.email}`);
  if (c.website)        lines.push(`URL:${c.website}`);
  if (c.location)       lines.push(`ADR;TYPE=HOME:;;${c.location};;;;`);
  if (c.birthday)       lines.push(`BDAY:${c.birthday.replace(/-/g, "")}`);
  const noteStr = [
    c.blood_group ? `Blood Group: ${c.blood_group}` : "",
    c.notes || "",
  ].filter(Boolean).join(" | ");
  if (noteStr) lines.push(`NOTE:${noteStr}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// POST /api/qr
export async function createQR(req, res) {
  try {
    const { name, type = "website", ...rest } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const qr_key = Math.random().toString(36).substring(2, 10);
    const doc = await QRCode.create({ qr_key, name, type, user_id: req.user.id, ...rest });

    res.json({ success: true, qr_key, qrUrl: `${process.env.BASE_URL}/qr/${doc.qr_key}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// GET /api/qr
export async function getAllQR(req, res) {
  try {
    const list = await QRCode.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/qr/:key
export async function getOneQR(req, res) {
  try {
    const doc = await QRCode.findOne({ qr_key: req.params.key, user_id: req.user.id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/qr/:key
export async function updateQR(req, res) {
  try {
    const doc = await QRCode.findOneAndUpdate(
      { qr_key: req.params.key, user_id: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, qrUrl: `${process.env.BASE_URL}/qr/${doc.qr_key}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/qr/:key
export async function deleteQR(req, res) {
  try {
    const doc = await QRCode.findOneAndDelete({ qr_key: req.params.key, user_id: req.user.id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── Public redirect (no auth) ────────────────────────────────────────────────

// GET /qr/:key
export async function redirectQR(req, res) {
  try {
    const doc = await QRCode.findOne({ qr_key: req.params.key });
    if (!doc) return res.status(404).send("QR code not found.");

    switch (doc.type) {
      case "website":
        return res.redirect(doc.destination || "/");

      case "email": {
        const params = new URLSearchParams();
        if (doc.email_subject) params.set("subject", doc.email_subject);
        if (doc.email_body)    params.set("body", doc.email_body);
        const qs = params.toString() ? `?${params.toString()}` : "";
        return res.redirect(`mailto:${doc.email_to}${qs}`);
      }

      case "maps":
        return res.redirect(doc.maps_link || "/");

      case "contact": {
        const vcard = buildVCard(doc.contact || {});
        res.setHeader("Content-Type", "text/vcard; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${doc.contact?.first_name || "contact"}.vcf"`);
        return res.send(vcard);
      }

      default:
        return res.redirect(doc.destination || "/");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
}