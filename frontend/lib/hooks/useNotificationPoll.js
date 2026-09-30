"use client";

import { useEffect, useRef } from "react";
import { getToken } from "../auth";
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
        // Requête partie pendant la déconnexion : sans importance
        if (
          error?.code === "UNAUTHENTICATED" ||
          error?.code === "UNAUTHORIZED"
        ) {
          return;
        }

        console.error(
          "Erreur lors de la vérification des notifications :",
          error
        );
      }
    };

    const timer = window.setInterval(poll, interval);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [interval]);
}