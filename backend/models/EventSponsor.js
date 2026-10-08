import mongoose from "mongoose";

const eventSponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    logo: { type: String, required: true },          // ex: /uploads/event-sponsors/uuid.png
    website: { type: String, trim: true, default: "" },
    tier: {
      type: String,
      enum: ["titre", "or", "argent", "bronze"],
      default: "bronze",
    },
    edition: { type: mongoose.Schema.Types.ObjectId, ref: "Edition", default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "event_sponsors" }
);

eventSponsorSchema.index({ edition: 1, order: 1 });

export default mongoose.model("EventSponsor", eventSponsorSchema);