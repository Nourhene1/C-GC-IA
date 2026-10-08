import { getTranslations } from "next-intl/server";
import { assetUrl } from "@/lib/eventSponsorsApi";

// Affiche la vidéo d'une annonce : fichier importé, YouTube ou Vimeo
export default async function NewsVideo({ video }) {
  if (!video?.provider) return null;
  const t = await getTranslations("news");

  // Vidéo importée : lecteur natif, la vidéo est servie par l'API
  if (video.provider === "file") {
    return (
      <figure className="mt-8">
        <video
          controls
          preload="metadata"
          playsInline
          src={assetUrl(video.url)}
          aria-label={t("video")}
          className="w-full rounded-2xl bg-slate-900 shadow-lg"
        />
      </figure>
    );
  }

  const src =
    video.provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${video.videoId}`
      : `https://player.vimeo.com/video/${video.videoId}`;

  return (
    <figure className="mt-8">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-lg">
        <iframe
          src={src}
          title={t("video")}
          className="absolute inset-0 size-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </figure>
  );
}