// Traduction automatique FR -> EN des contenus saisis par l'admin
// (actualités, FAQ, règlement, éligibilité, jury, éditions…).
//
// Fournisseur choisi avec TRANSLATE_PROVIDER dans le .env :
//   - "groq"     : LLM Llama via Groq, GRATUIT (limites de débit) — recommandé
//   - "gemini"   : LLM Gemini via Google AI Studio, gratuit (limites de débit)
//   - "mymemory" : service de traduction gratuit, qualité plus simple
// Si le LLM échoue (limite atteinte, panne, clé invalide), on bascule sur MyMemory.

const PROVIDER = (process.env.TRANSLATE_PROVIDER || "mymemory").toLowerCase();
const LANG_NAMES = { fr: "French", en: "English", ar: "Arabic" };

// ---------------------------------------------------------------------------
// Consignes communes aux LLM : traduire fidèlement et garder la mise en forme
// ---------------------------------------------------------------------------

function instructions(from, to) {
  return [
    "You translate content for the website of a university competition on AI and Civil Engineering (ISET Sfax, Tunisia).",
    `Translate the user's text from ${LANG_NAMES[from] || from} to ${LANG_NAMES[to] || to}.`,
    "Rules:",
    "- Output ONLY the translation, with no introduction, quotes, notes or comments.",
    '- Keep exactly the same formatting: line breaks, empty lines, lines starting with "## " (headings) and "- " (list items).',
    "- Keep names of people, teams, institutions (ISET Sfax…), acronyms, dates, amounts (DT) and URLs unchanged.",
    '- Use standard civil engineering terminology (e.g. "béton armé" = "reinforced concrete", "maître d\'ouvrage" = "project owner").',
    "- Use a clear, formal tone suitable for official announcements.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Groq (gratuit) — API au même format que celle d'OpenAI
// ---------------------------------------------------------------------------

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

async function translateWithGroq(text, from, to) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY manquant dans le .env");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2, // peu de créativité : on veut une traduction fidèle
      messages: [
        { role: "system", content: instructions(from, to) },
        { role: "user", content: text },
      ],
    }),
    signal: AbortSignal.timeout(30_000), // 30 s maximum
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 429 = limite gratuite atteinte ; 401 = clé invalide ; 404 = modèle inconnu
    throw new Error(`Groq ${res.status} : ${data.error?.message || "erreur inconnue"}`);
  }

  const output = data.choices?.[0]?.message?.content?.trim();
  if (!output) throw new Error("Groq : réponse vide");
  return output;
}

// ---------------------------------------------------------------------------
// Gemini (gratuit) — Google AI Studio
// ---------------------------------------------------------------------------

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

async function translateWithGemini(text, from, to) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY manquant dans le .env");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions(from, to) }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status} : ${data.error?.message || "erreur inconnue"}`);

  const output = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!output) throw new Error("Gemini : réponse vide");
  return output;
}

// ---------------------------------------------------------------------------
// MyMemory (gratuit, secours)
// ---------------------------------------------------------------------------

const MYMEMORY_MAX_BYTES = 450; // l'API refuse plus de 500 octets par requête

function splitBySentences(text) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && Buffer.byteLength(current + sentence) > MYMEMORY_MAX_BYTES) {
      chunks.push(current);
      current = "";
    }
    current += sentence;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateWithMyMemory(text, from, to) {
  const parts = [];
  for (const chunk of splitBySentences(text)) {
    if (!chunk.trim()) {
      parts.push(chunk);
      continue;
    }
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", chunk.trim());
    url.searchParams.set("langpair", `${from}|${to}`);
    if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const data = await res.json();
    if (Number(data.responseStatus) !== 200) throw new Error("MyMemory : traduction refusée");

    const trailing = chunk.match(/\s*$/)[0]; // espaces / retours à la ligne en fin de morceau
    parts.push(data.responseData.translatedText.trim() + trailing);
  }
  return parts.join("").trim();
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

export async function translate(text, from = "fr", to = "en") {
  if (!text?.trim()) return "";

  const llm = { groq: translateWithGroq, gemini: translateWithGemini }[PROVIDER];
  if (llm) {
    try {
      return await llm(text, from, to);
    } catch (err) {
      console.error(`Traduction ${PROVIDER} indisponible, bascule sur MyMemory :`, err.message);
    }
  }

  try {
    return await translateWithMyMemory(text, from, to);
  } catch {
    throw new Error("TRANSLATION_FAILED");
  }
}

// Affiché au démarrage du serveur pour savoir quel fournisseur est actif
export const translateProvider =
  PROVIDER === "groq" ? `Groq (${GROQ_MODEL})`
  : PROVIDER === "gemini" ? `Gemini (${GEMINI_MODEL})`
  : "MyMemory";
