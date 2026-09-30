import mongoose from "mongoose";

const text = {
  fr: { type: String, default: "" },
  en: { type: String, default: "" },
};

// F4.6 : notification in-app
const notificationSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:   { type: String, required: true }, // "subject_open", "subject_addendum"…
    title:  text,
    body:   text,
    link:   { type: String, default: "" },    // chemin front, ex. /team/subject
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);