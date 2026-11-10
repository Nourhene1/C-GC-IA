"use client";
import { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";

export default function PosterLightbox({ src, alt, openLabel }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        className="group relative mx-auto block w-64 sm:w-72"
      >
        <span aria-hidden className="absolute -inset-8 rounded-full bg-accent/30 blur-3xl motion-safe:animate-[pulse_5s_ease-in-out_infinite]" />
        <span aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rotate-3 rounded-2xl bg-accent transition-transform duration-500 group-hover:translate-x-5 group-hover:translate-y-5 group-hover:rotate-6" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="relative aspect-[3/4] w-full -rotate-2 rounded-2xl bg-white object-cover shadow-2xl shadow-black/50 ring-4 ring-white transition duration-500 group-hover:rotate-0 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-white text-primary opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="size-5" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white text-primary"
            aria-label="Fermer"
          >
            <X className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}