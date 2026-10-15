"use client";

import { useEffect, useRef } from "react";
import { getToken } from "../auth";
import { isAuthError } from "../api";
import { getNotifications } from "../notifications";

export default function useNotificationPoll(
  onUpdate,
  interval = 30000
) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const poll = async () => {
      // Pas de token (déconnexion, session expirée) : aucun appel
      if (!getToken()) {
        return;
      }

      try {
        const data = await getNotifications();

        if (cancelled) {
          return;
        }

        const notifications = Array.isArray(data)
          ? data
          : data?.notifications || [];

        onUpdateRef.current?.(notifications);
      } catch (error) {
        // Session expirée / non authentifié : api() a déjà vidé la
        // session et lancé la redirection vers /login. On arrête le
        // polling et on ne logge rien.
        if (isAuthError(error)) {
          stop();
          return;
        }

        console.error(
          "Erreur lors de la vérification des notifications :",
          error
        );
      }
    };

    // Premier appel immédiat, puis toutes les `interval` ms
    poll();
    timer = window.setInterval(poll, interval);

    return () => {
      cancelled = true;
      stop();
    };
  }, [interval]);
}