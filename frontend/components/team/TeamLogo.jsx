import { Users } from "lucide-react";
import { publicFileUrl } from "@/lib/api";

// Logo de l'équipe, ou une icône si l'équipe n'en a pas
export default function TeamLogo({ logo, name, size = "size-16" }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
      <img src={publicFileUrl(logo)} alt={name}
        className={`${size} shrink-0 rounded-2xl border border-slate-200 bg-white object-cover`} />
    );
  }
  return (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-2xl bg-accent-light`}>
      <Users className="size-1/2 text-accent" />
    </div>
  );
}
