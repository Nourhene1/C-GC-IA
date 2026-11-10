
import OrganizationMember from "../models/OrganizationMember.js";
import { removeFile, publicPath } from "../utils/files.js";

const publicUrl = (filename) => `/uploads/organization/${filename}`;
const dropFile = (photo) => photo && removeFile(publicPath(photo));

// GET /api/organization — public
export async function listPublicMembers(req, res, next) {
  try {
    const members = await OrganizationMember.find()
      .sort({ order: 1, createdAt: 1 })
      .select("firstName lastName role photo")
      .lean();

    res.json({ members });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/organization
export async function listAdminMembers(req, res, next) {
  try {
    const members = await OrganizationMember.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ members });
  } catch (err) {
    next(err);
  }
}

// Lit le corps multipart : firstName, lastName, role, order
async function readBody(body) {
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const role = body.role?.trim();

  if (!firstName || !lastName) {
    return { error: "FIELDS_REQUIRED" };
  }

  if (!role) {
    return { error: "ROLE_REQUIRED" };
  }

  return {
    data: {
      firstName,
      lastName,
      role,
      order: Number(body.order) || 0,
    },
  };
}

// POST /api/admin/organization
// multipart : photo + firstName + lastName + role + order
export async function createMember(req, res, next) {
  try {
    const { data, error } = await readBody(req.body);

    if (error) {
      if (req.file) {
        await dropFile(publicUrl(req.file.filename));
      }

      return res.status(400).json({ code: error });
    }

    if (req.file) {
      data.photo = publicUrl(req.file.filename);
    }

    const member = await OrganizationMember.create(data);

    res.status(201).json({ member });
  } catch (err) {
    if (req.file) {
      await dropFile(publicUrl(req.file.filename));
    }

    next(err);
  }
}

// PUT /api/admin/organization/:id
// multipart optionnel : photo, removePhoto
export async function updateMember(req, res, next) {
  try {
    const current = await OrganizationMember.findById(req.params.id).lean();

    if (!current) {
      if (req.file) {
        await dropFile(publicUrl(req.file.filename));
      }

      return res.status(404).json({ code: "NOT_FOUND" });
    }

    const { data, error } = await readBody(req.body);

    if (error) {
      if (req.file) {
        await dropFile(publicUrl(req.file.filename));
      }

      return res.status(400).json({ code: error });
    }

    if (req.file) {
      data.photo = publicUrl(req.file.filename);
      await dropFile(current.photo);
    } else if (req.body.removePhoto === "true") {
      data.photo = null;
      await dropFile(current.photo);
    }

    const member = await OrganizationMember.findByIdAndUpdate(
      req.params.id,
      data,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({ member });
  } catch (err) {
    if (req.file) {
      await dropFile(publicUrl(req.file.filename));
    }

    next(err);
  }
}

// DELETE /api/admin/organization/:id
export async function deleteMember(req, res, next) {
  try {
    const member = await OrganizationMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ code: "NOT_FOUND" });
    }

    await dropFile(member.photo);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
