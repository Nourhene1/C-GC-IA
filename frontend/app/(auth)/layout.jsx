import LanguageSwitcher from "@/components/LanguageSwitcher";
import AuthBackground from "@/components/auth/AuthBackground";

export default function AuthLayout({ children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface p-4">
      <LanguageSwitcher className="absolute right-4 top-4 z-10" />

      {/* décor animé : IA + Génie Civil (visible seulement sur grand écran) */}
      <AuthBackground />

      <div className="relative w-full max-w-4xl py-10">{children}</div>
    </main>
  );
}