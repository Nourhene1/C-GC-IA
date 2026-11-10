
import mongoose from "mongoose";

const organizationMemberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    photo: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "organization_members",
  }
);

export default mongoose.model("OrganizationMember", organizationMemberSchema);
