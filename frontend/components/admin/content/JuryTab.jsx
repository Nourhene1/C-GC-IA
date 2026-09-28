"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserRound, ImagePlus } from "lucide-react";
import { btn } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";
import { LOGO_MAX_MB } from "@/lib/constants";
import RepeatableList from "./RepeatableList";
import TextPair, { smallInput } from "./TextPair";

// Photo d'un juré : envoyée tout de suite, son chemin est gardé dans la liste
function PhotoPicker({ photo, onChange, onError }) {
  const t = useTranslations("adminContent");
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > LOGO_MAX_MB * 1024 * 1024) return onError("FILE_TOO_LARGE");
    const data = new FormData();
    data.append("file", file);
    setBusy(true);
    try {
      const res = await api("/api/admin/content/jury-photo", { method: "POST", body: data });
      onChange(res.photo);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className="group relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-accent-light"
      title={t("changePhoto")}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
        <img src={publicFileUrl(photo)} alt="" className="size-full object-cover" />
      ) : (
        <UserRound className="size-9 text-accent" />
      )}
      <span className={`absolute inset-0 flex items-center justify-center bg-primary/60 text-white transition ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <ImagePlus className="size-5" />
      </span>
      <input type="file" accept=".png,.jpg,.jpeg,.webp" className="sr-only" onChange={upload} />
    </label>
  );
}

// F3.6 : membres du jury
export default function JuryTab({ content, onSave, onError }) {
  const t = useTranslations("adminContent");
  const [jury, setJury] = useState(content.jury || []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ jury }); }} className="flex flex-col gap-6">
      <RepeatableList
        items={jury}
        onChange={setJury}
        addLabel={t("addJury")}
        newItem={() => ({ name: "", role: { fr: "", en: "" }, organization: "", photo: null })}
        renderItem={(m, update) => (
          <div className="flex flex-col gap-4 sm:flex-row">
            <PhotoPicker photo={m.photo} onChange={(photo) => update({ photo })} onError={onError} />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={smallInput} placeholder={t("name")} aria-label={t("name")} required
                  value={m.name} onChange={(e) => update({ name: e.target.value })} />
                <input className={smallInput} placeholder={t("organization")} aria-label={t("organization")}
                  value={m.organization} onChange={(e) => update({ organization: e.target.value })} />
              </div>
              <TextPair label={t("role")} value={m.role} onChange={(role) => update({ role })} />
            </div>
          </div>
        )}
      />
      <button type="submit" className={`${btn.primary} self-end`}>{t("save")}</button>
    </form>
  );
}
