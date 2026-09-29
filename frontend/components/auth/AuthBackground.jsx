import {
  Cpu, BrainCircuit, Bot, Sparkles, CircuitBoard,
  HardHat, Building2, Construction, DraftingCompass, Ruler,
} from "lucide-react";

// Icônes seules (sans fond) avec ombre portée colorée.
// tone : "primary" (bleu) | "accent" (orange)
// Thèmes : IA (Cpu, BrainCircuit, Bot, Sparkles, CircuitBoard) + Génie Civil (HardHat, Building2, Construction, DraftingCompass, Ruler)
const items = [
  // gauche
  { Icon: BrainCircuit,    pos: "left-[6%] top-[9%]",       icon: "size-24", tone: "primary", anim: "float-a", dur: 7, delay: 0 },
  { Icon: HardHat,         pos: "left-[11%] top-[42%]",     icon: "size-20", tone: "accent",  anim: "float-b", dur: 8, delay: -2 },
  { Icon: Building2,       pos: "left-[5%] bottom-[9%]",    icon: "size-28", tone: "primary", anim: "float-a", dur: 9, delay: -4 },
  { Icon: Ruler,           pos: "left-[2%] top-[30%]",      icon: "size-12", tone: "accent",  anim: "float-c", dur: 6, delay: -1, hide: true },
  { Icon: Sparkles,        pos: "left-[15%] top-[20%]",     icon: "size-12", tone: "accent",  anim: "float-c", dur: 5, delay: -3, hide: true },
  // droite
  { Icon: Bot,             pos: "right-[7%] top-[9%]",      icon: "size-24", tone: "primary", anim: "float-b", dur: 8, delay: -1 },
  { Icon: DraftingCompass, pos: "right-[10%] top-[42%]",    icon: "size-20", tone: "primary", anim: "float-a", dur: 7, delay: -5 },
  { Icon: Cpu,             pos: "right-[7%] bottom-[10%]",  icon: "size-28", tone: "accent",  anim: "float-b", dur: 9, delay: -3 },
  { Icon: Construction,    pos: "right-[2%] top-[62%]",     icon: "size-12", tone: "accent",  anim: "float-c", dur: 6, delay: -2, hide: true },
  { Icon: CircuitBoard,    pos: "right-[15%] top-[20%]",    icon: "size-12", tone: "primary", anim: "float-c", dur: 5, delay: -4, hide: true },
];

const tones = {
  primary: { front: "text-primary/45", shadow: "text-primary/60" },
  accent:  { front: "text-accent/50",  shadow: "text-accent/60" },
};

export default function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      {/* halos lumineux flous pour donner de la profondeur */}
      <div className="bg-blob absolute -left-24 top-1/4 size-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="bg-blob absolute -right-24 bottom-1/4 size-96 rounded-full bg-primary/10 blur-3xl" style={{ animationDelay: "-6s" }} />

      {/* icônes flottantes + leur ombre floue qui bouge derrière */}
      {items.map(({ Icon, pos, icon, tone, anim, dur, delay, hide }, i) => (
        <div key={i} className={`absolute ${pos} ${hide ? "hidden xl:block" : ""}`}>
          {/* ombre : même icône, floue, décalée, qui s'éloigne/se rapproche */}
          <div
            className="bg-shadow absolute inset-0"
            style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          >
            <Icon className={`${icon} ${tones[tone].shadow} blur-[7px]`} strokeWidth={2.2} />
          </div>
          {/* icône au premier plan, estompée */}
          <div
            className={`bg-${anim} relative`}
            style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          >
            <Icon className={`${icon} ${tones[tone].front}`} strokeWidth={1.8} />
          </div>
        </div>
      ))}

      {/* traits décoratifs qui glissent doucement */}
      <span className="bg-slide absolute -left-10 top-16 h-1 w-64 -rotate-45 rounded-full bg-accent/60" />
      <span className="bg-slide absolute -right-10 bottom-16 h-1 w-64 -rotate-45 rounded-full bg-primary/40" style={{ animationDelay: "-3s" }} />

      <style>{`
        @keyframes bg-float-a { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-22px) rotate(4deg); } }
        @keyframes bg-float-b { 0%,100% { transform: translate(0,0) rotate(3deg); } 33% { transform: translate(10px,-16px) rotate(-3deg); } 66% { transform: translate(-8px,-8px) rotate(5deg); } }
        @keyframes bg-float-c { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-14px) scale(1.12); } }
        @keyframes bg-blob { 0%,100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.2); opacity: 1; } }
        @keyframes bg-slide { 0%,100% { transform: translate(0,0); } 50% { transform: translate(18px,-18px); } }
        @keyframes bg-shadow { 0%,100% { transform: translate(6px,10px) scale(1); opacity: .55; } 50% { transform: translate(22px,34px) scale(.92); opacity: .25; } }
        .bg-shadow { animation: bg-shadow ease-in-out infinite; }
        .bg-float-a { animation: bg-float-a ease-in-out infinite; }
        .bg-float-b { animation: bg-float-b ease-in-out infinite; }
        .bg-float-c { animation: bg-float-c ease-in-out infinite; }
        .bg-blob { animation: bg-blob 12s ease-in-out infinite; }
        .bg-slide { animation: bg-slide 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bg-float-a, .bg-float-b, .bg-float-c, .bg-blob, .bg-slide, .bg-shadow { animation: none; }
        }
      `}</style>
    </div>
  );
}