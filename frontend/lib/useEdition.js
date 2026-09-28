"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

// Charge l'édition en cours et calcule si les inscriptions sont ouvertes,
// avec l'heure du SERVEUR (l'horloge du visiteur peut être fausse).
export function useEdition() {
  const [state, setState] = useState({ edition: null, registrationOpen: true, loading: true });

  useEffect(() => {
    api("/api/editions/current")
      .then(({ edition, now }) => {
        const n = new Date(now);
        setState({
          edition,
          loading: false,
          registrationOpen:
            n >= new Date(edition.dates.registrationOpen) &&
            n <= new Date(edition.dates.registrationClose),
        });
      })
      .catch(() => setState({ edition: null, registrationOpen: false, loading: false }));
  }, []);

  return state;
}
