import { Cpu, HardHat, Laptop, Settings, BrainCircuit, Building2 } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AuthLayout({ children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface p-4">
      <LanguageSwitcher className="absolute right-4 top-4 z-10" />

      {/* décor : visible seulement sur grand écran */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden text-primary/10 lg:block">
        <Cpu className="absolute left-[7%] top-[8%] size-24" />
        <HardHat className="absolute left-[10%] top-[42%] size-20 text-accent/25" />
        <Building2 className="absolute bottom-[10%] left-[6%] size-28" />
        <Laptop className="absolute right-[7%] top-[8%] size-24" />
        <Settings className="absolute right-[12%] top-[40%] size-16" />
        <BrainCircuit className="absolute bottom-[12%] right-[8%] size-24" />
        <span className="absolute -left-10 top-16 h-1 w-64 -rotate-45 bg-accent/60" />
        <span className="absolute -right-10 bottom-16 h-1 w-64 -rotate-45 bg-primary/40" />
      </div>

      <div className="relative w-full max-w-4xl py-10">{children}</div>
    </main>
  );
}
