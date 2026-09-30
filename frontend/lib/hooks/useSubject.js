"use client";

import { useCallback, useEffect, useState } from "react";
import { getSubject, getAdminSubject } from "../subject";

// Code renvoyé par le back (403) tant que l'heure d'ouverture n'est pas atteinte
const NOT_OPEN = "SUBJECT_NOT_OPEN";

export default function useSubject({ admin = false } = {}) {
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Sujet pas encore publié : situation normale, pas une erreur
  const [notOpen, setNotOpen] = useState(null); // null | { opensAt: string | null }

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = admin ? await getAdminSubject() : await getSubject();

      setNotOpen(null);
      setSubject(data);
    } catch (err) {
      if (err?.code === NOT_OPEN) {
        setSubject(null);
        setNotOpen({ opensAt: err.data?.opensAt ?? null });
        return;
      }

      console.error("Erreur lors du chargement du sujet :", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { subject, loading, error, notOpen, refetch };
}