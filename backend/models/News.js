import mongoose from "mongoose";

export const NEWS_CATEGORIES = ["lancement", "rappel", "resultats", "general"];

// F1.2 : actualité / annonce bilingue et horodatée
const newsSchema = new mongoose.Schema(
  {
    edition:  { type: mongoose.Schema.Types.ObjectId, ref: "Edition" },
    category: { type: String, enum: NEWS_CATEGORIES, default: "general" },
    title: {
      fr: { type: String, required: true, trim: true, maxlength: 150 },
      en: { type: String, trim: true, default: "", maxlength: 150 },
    },
    content: {
      fr: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: "" },
    },

    // F1.6 : publiée ou non, et à partir de quand (publication différée)
    published: { type: Boolean, default: false },
    publishAt: { type: Date, default: null },

    // F1.4 : prévenir les équipes par email au moment de la publication
    notifyTeams: { type: Boolean, default: false },
    notifiedAt:  { type: Date, default: null },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// État calculé : brouillon, programmée ou publiée
newsSchema.virtual("state").get(function () {
  if (!this.published) return "draft";
  return this.publishAt > new Date() ? "scheduled" : "published";
});

// Filtre des actualités visibles par le public : publiées ET date atteinte
newsSchema.statics.visibleFilter = () => ({ published: true, publishAt: { $lte: new Date() } });

newsSchema.index({ published: 1, publishAt: -1 });

export default mongoose.model("News", newsSchema);
