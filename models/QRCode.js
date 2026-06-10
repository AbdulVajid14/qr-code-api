import mongoose from "mongoose";

const qrCodeSchema = new mongoose.Schema(
  {
    qr_key: { type: String, required: true, unique: true },
    name:   { type: String, required: true },

    // Owner
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // "website" | "contact" | "email" | "maps"
    type: { type: String, required: true, default: "website" },

    // WEBSITE
    destination: { type: String, default: "" },

    // EMAIL
    email_to:      { type: String, default: "" },
    email_subject: { type: String, default: "" },
    email_body:    { type: String, default: "" },

    // MAPS
    maps_link:  { type: String, default: "" },
    maps_label: { type: String, default: "" },

    // CONTACT (vCard)
    contact: {
      first_name:    { type: String, default: "" },
      last_name:     { type: String, default: "" },
      phone_personal:{ type: String, default: "" },
      phone_work:    { type: String, default: "" },
      email:         { type: String, default: "" },
      website:       { type: String, default: "" },
      location:      { type: String, default: "" },
      maps_link:     { type: String, default: "" },
      blood_group:   { type: String, default: "" },
      organization:  { type: String, default: "" },
      job_title:     { type: String, default: "" },
      birthday:      { type: String, default: "" },
      notes:         { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("QRCode", qrCodeSchema);