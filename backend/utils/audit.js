import AuditLog from "../models/AuditLog.js";

// F4.4 : enregistre une action. Ne fait jamais échouer la requête.
// Utilisable partout : await audit(req, "LOGIN"), audit(req, "SOLUTION_UPLOAD", {...})
export async function audit(req, action, { resource, resourceId, meta } = {}) {
  try {
    await AuditLog.create({
      user: req.user?._id ?? null,
      role: req.user?.role,
      team: req.team?._id ?? req.user?.team ?? null,
      action,
      resource,
      resourceId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      meta,
    });
  } catch (err) {
    console.error("Audit impossible :", err.message);
  }
}