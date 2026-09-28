// Affiche un texte saisi par l'admin avec une mise en forme simple :
//   "## Titre"      -> sous-titre
//   "- élément"     -> liste à puces
//   ligne vide      -> nouveau paragraphe
// Le texte n'est jamais interprété comme du HTML : aucun risque d'injection.
function parse(text) {
  const blocks = [];
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();

    if (line.startsWith("- ")) {
      flushPara();
      if (!list) {
        list = [];
        blocks.push({ type: "ul", items: list });
      }
      list.push(line.slice(2));
      continue;
    }
    list = null; // toute autre ligne termine la liste

    if (!line) flushPara();
    else if (line.startsWith("## ")) {
      flushPara();
      blocks.push({ type: "h", text: line.slice(3) });
    } else para.push(line);
  }
  flushPara();
  return blocks;
}

export default function RichText({ text, className = "" }) {
  if (!text) return null;

  return (
    <div className={`flex flex-col gap-4 leading-relaxed text-ink ${className}`}>
      {parse(text).map((b, i) =>
        b.type === "h" ? (
          <h2 key={i} className="mt-2 text-xl font-bold text-primary">{b.text}</h2>
        ) : b.type === "ul" ? (
          <ul key={i} className="flex list-disc flex-col gap-1.5 pl-6 marker:text-accent">
            {b.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">{b.text}</p>
        )
      )}
    </div>
  );
}
