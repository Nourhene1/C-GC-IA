import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomToken, hashToken } from "../utils/tokens.js";

const userSchema = new mongoose.Schema(
  {
    nom:    { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Vide tant qu'un membre invité n'a pas activé son compte
    password: { type: String, minlength: 8, select: false },

    role: {
      type: String,
      enum: ["admin", "chef", "membre", "jury"],
      default: "membre",
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    locale: {
      type: String,
      enum: ["fr", "en"],
      default: "fr"
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    // Jeton envoyé par email (confirmation F2.1 ou invitation F2.3).
    // On ne stocke que son empreinte (hash), jamais le jeton lui-même.
    emailToken: {
      type: String,
      select: false
    },

    emailTokenExpires: {
      type: Date,
      select: false
    },

    // Code de récupération du mot de passe
    resetPasswordCode: {
      type: String,
      select: false
    },

    resetPasswordCodeExpires: {
      type: Date,
      select: false
    },
  },
  { timestamps: true }
);

// Chiffre le mot de passe avant l'enregistrement s'il a changé
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Crée un nouveau jeton email valable `hours` heures
// et renvoie la version en clair
userSchema.methods.createEmailToken = function (hours) {
  const token = randomToken();

  this.emailToken = hashToken(token);
  this.emailTokenExpires = new Date(
    Date.now() + hours * 60 * 60 * 1000
  );

  return token;
};

userSchema.methods.clearEmailToken = function () {
  this.emailToken = undefined;
  this.emailTokenExpires = undefined;
};

// Crée un code numérique de récupération à 6 chiffres
userSchema.methods.createResetPasswordCode = function (minutes = 15) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  this.resetPasswordCode = hashToken(code);
  this.resetPasswordCodeExpires = new Date(
    Date.now() + minutes * 60 * 1000
  );

  return code;
};

// Supprime le code de récupération
userSchema.methods.clearResetPasswordCode = function () {
  this.resetPasswordCode = undefined;
  this.resetPasswordCodeExpires = undefined;
};

// Retrouve un utilisateur à partir du jeton reçu dans le lien
userSchema.statics.findByEmailToken = function (
  token,
  extraFilter = {}
) {
  return this.findOne({
    emailToken: hashToken(token),
    emailTokenExpires: { $gt: new Date() },
    ...extraFilter,
  }).select("+password +emailToken +emailTokenExpires");
};

// Retrouve un utilisateur à partir du code de récupération
userSchema.statics.findByResetPasswordCode = function (
  code,
  extraFilter = {}
) {
  return this.findOne({
    resetPasswordCode: hashToken(code),
    resetPasswordCodeExpires: { $gt: new Date() },
    ...extraFilter,
  }).select(
    "+password +resetPasswordCode +resetPasswordCodeExpires"
  );
};

export default mongoose.model("User", userSchema);