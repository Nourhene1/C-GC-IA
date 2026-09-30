"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import useNotifications from "@/lib/hooks/useNotifications";
import useNotificationPoll from "@/lib/hooks/useNotificationPoll";

const NotificationContext = createContext(null);

// À monter uniquement dans les pages connectées (AppShell) : le polling démarre
// à la connexion et s'arrête au démontage, donc à la déconnexion.
export function NotificationProvider({ children }) {
  const state = useNotifications();
  const [open, setOpen] = useState(false);

  // Le polling met à jour la liste sans repasser par l'état "loading"
  useNotificationPoll(state.setNotifications);

  const togglePanel = useCallback(() => setOpen((v) => !v), []);
  const closePanel = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ ...state, open, togglePanel, closePanel }),
    [state, open, togglePanel, closePanel]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext doit être utilisé dans <NotificationProvider>");
  }
  return ctx;
}