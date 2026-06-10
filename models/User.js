import mongoose from "mongoose";
 
const userSchema = new mongoose.Schema(
  {
    google_id: { type: String, required: true, unique: true },
    name:      { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    avatar:    { type: String, default: "" },
  },
  { timestamps: true }
);
 
export default mongoose.model("User", userSchema);