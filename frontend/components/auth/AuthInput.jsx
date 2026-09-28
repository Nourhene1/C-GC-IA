"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({ icon: Icon, type = "text", ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary/70" />
      <input
        type={isPassword && show ? "text" : type}
        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-slate-50"
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      )}
    </div>
  );
}
