// Traduction automatique gratuite avec l'API MyMemory.
// Limite : 5 000 caractères/jour, 50 000 avec MYMEMORY_EMAIL dans le .env.
const MAX_BYTES = 450; // l'API refuse plus de 500 octets par requête

// Découpe le texte en morceaux de phrases entières
function splitText(text) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && Buffer.byteLength(current + sentence) > MAX_BYTES) {
      chunks.push(current);
      current = "";
    }
    current += sentence;
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function translate(text, from = "fr", to = "en") {
  if (!text?.trim()) return "";
  const parts = [];

  for (const chunk of splitText(text)) {
    // On garde les retours à la ligne tels quels
    if (!chunk.trim()) {
      parts.push(chunk);
      continue;
    }
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", chunk.trim());
    url.searchParams.set("langpair", `${from}|${to}`);
    if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);

    const res = await fetch(url);
    const data = await res.json();
    if (Number(data.responseStatus) !== 200) throw new Error("TRANSLATION_FAILED");

    const trailing = chunk.match(/\s*$/)[0]; // espaces / retours à la ligne en fin de morceau
    parts.push(data.responseData.translatedText.trim() + trailing);
  }
  return parts.join("").trim();
}
