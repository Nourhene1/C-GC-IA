"use client";
import { useEffect, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

// Compte à rebours basé sur l'heure du serveur (offset = heure serveur - heure navigateur)
export default function Countdown({ target, offset = 0, className = "" }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = new Date(target).getTime() - (Date.now() + offset);
  if (Number.isNaN(ms) || ms <= 0) return null;

  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);

  return (
    <span className={`tabular-nums ${className}`}>
      {days > 0 && `${days}j `}
      {pad(h)}:{pad(m)}:{pad(s % 60)}
    </span>
  );
}