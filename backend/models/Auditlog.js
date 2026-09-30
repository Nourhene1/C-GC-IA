import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

// F4.4 : journal d'audit générique (sujet, mais aussi toute autre activité)
const auditLogSchema = new mongoose.Schema({
  at:         { type: Date, default: Date.now, index: true },
  user:       { type: ObjectId, ref: "User", default: null },
  role:       String,
  team:       { type: ObjectId, ref: "Team", default: null },
  action:     { type: String, required: true }, // ex. SUBJECT_VIEW, SUBJECT_DOWNLOAD…
  resource:   String,
  resourceId: { type: ObjectId, default: null },
  ip:         String,
  userAgent:  String,
  meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
});

auditLogSchema.index({ team: 1, at: -1 });
auditLogSchema.index({ action: 1, at: -1 });

export default mongoose.model("AuditLog", auditLogSchema);