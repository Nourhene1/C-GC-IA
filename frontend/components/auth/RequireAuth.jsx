"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { getToken, logout, homeFor } from "@/lib/auth";
import Spinner from "@/components/ui/Spinner";

// Affiche la page seulement si l'utilisateur est connecté et a un des rôles demandés.
// Utilisation : <RequireAuth roles={["chef"]}>{(user) => <MaPage user={user} />}</RequireAuth>
export default function RequireAuth({ roles, children }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [user, setUser] = useState(null);
  const rolesKey = roles?.join(","); // chaîne stable : évite de relancer l'effet en boucle

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    api("/api/auth/me")
      .then(({ user }) => {
        if (rolesKey && !rolesKey.split(",").includes(user.role)) {
          router.replace(homeFor(user));
          return;
        }
        setUser(user);
      })
      .catch(() => {
        logout();
        router.replace("/login");
      });
  }, [router, rolesKey]);

  if (!user) return <div className="min-h-screen bg-surface"><Spinner label={t("loading")} /></div>;

  return children(user);
}
