import { translate } from "./translate.js";

const clean = (s) => (s || "").trim();

// Prend un texte bilingue envoyé par le formulaire ({ fr, en }) et la version
// déjà enregistrée, et renvoie { fr, en } avec l'anglais traduit automatiquement.
//
// Règles :
//  - l'admin a corrigé l'anglais lui-même  -> on garde sa correction
//  - le français n'a pas changé            -> on garde l'anglais existant (pas d'appel inutile)
//  - sinon (nouveau texte, français modifié, anglais vide) -> traduction automatique
// Si la traduction échoue, l'anglais reste vide : le site affiche alors le français.
export async function withEnglish(next = {}, previous = {}) {
  const fr = clean(next.fr);
  if (!fr) return { fr: "", en: "" };

  const prevFr = clean(previous?.fr);
  const prevEn = clean(previous?.en);
  const sentEn = clean(next.en);

  const frChanged = fr !== prevFr;
  const enEditedByAdmin = sentEn && sentEn !== prevEn;

  if (enEditedByAdmin) return { fr, en: sentEn };
  if (!frChanged && prevEn) return { fr, en: prevEn };

  try {
    return { fr, en: await translate(fr, "fr", "en") };
  } catch {
    console.error(`Traduction automatique impossible pour : « ${fr.slice(0, 60)}… »`);
    return { fr, en: frChanged ? "" : prevEn };
  }
}

// Même chose pour une liste (prix, jury, contacts, événements) :
// chaque élément est comparé à sa version enregistrée grâce à son _id.
// Les traductions sont faites une par une pour respecter la limite par minute de l'offre gratuite.
export async function withEnglishList(items = [], previousItems = [], fields = []) {
  const byId = new Map(previousItems.map((p) => [String(p._id), p]));
  const result = [];
  for (const item of items) {
    const prev = item._id ? byId.get(String(item._id)) || {} : {};
    const out = { ...item };
    for (const f of fields) out[f] = await withEnglish(item[f], prev[f]);
    result.push(out);
  }
  return result;
}
