import { getLocale, getTranslations } from "next-intl/server";
import { Video } from "lucide-react";
import NewsVideo from "@/components/public/NewsVideo";
import { pick } from "@/lib/content";

// Vidéos de présentation des équipes gagnantes (seulement celles qui ont une vidéo)
export default async function WinnerVideos({ winners = [] }) {
  const withVideo = winners
    .filter((w) => w.video?.provider)
    .sort((a, b) => a.rank - b.rank);

  if (withVideo.length === 0) return null;

  const t = await getTranslations("archives");
  const locale = await getLocale();

  return (
    <section>
      <h2 className="mb-8 flex items-center justify-center gap-2 text-center text-2xl font-extrabold text-primary sm:text-3xl">
        <Video className="size-6 text-accent" />
        {t("winnerVideos")}
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {withVideo.map((w) => (
          <article key={w.rank} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-md shadow-primary/5">
            <NewsVideo video={w.video} />
            <div>
              <p className="font-bold text-primary">
                <span className="mr-2 text-accent">#{w.rank}</span>
                {w.teamName}
              </p>
              {w.etablissement && <p className="text-sm text-slate-500">{w.etablissement}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}