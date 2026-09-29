"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { UserRound, ImagePlus, Mail, MailCheck, BadgeCheck, Send } from "lucide-react";
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

// État du compte du juré : invitation envoyée / compte activé (+ bouton pour renvoyer)
function AccountStatus({ member, onError }) {
  const t = useTranslations("adminContent");
  const [state, setState] = useState("idle"); // idle | sending | sent

  if (member.account === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <BadgeCheck className="size-3.5" /> {t("juryActive")}
      </span>
    );
  }
  if (member.account !== "invited") return null;

  const resend = async () => {
    setState("sending");
    try {
      await api(`/api/admin/content/jury/${member._id}/invite`, { method: "POST" });
      setState("sent");
    } catch (err) {
      onError(err);
      setState("idle");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-semibold text-accent">
        <MailCheck className="size-3.5" /> {t("juryInvited")}
      </span>
      <button type="button" onClick={resend} disabled={state !== "idle"}
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent disabled:opacity-60">
        <Send className="size-3.5" /> {state === "sent" ? t("inviteSent") : state === "sending" ? t("inviteSending") : t("resendInvite")}
      </button>
    </div>
  );
}

// F3.6 : membres du jury
export default function JuryTab({ content, onSave, onError }) {
  const t = useTranslations("adminContent");
  const [jury, setJury] = useState(content.jury || []);

  // Après l'enregistrement, on reprend la liste du serveur (identifiants + état des comptes)
  useEffect(() => setJury(content.jury || []), [content.jury]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ jury }); }} className="flex flex-col gap-6">
      <RepeatableList
        items={jury}
        onChange={setJury}
        addLabel={t("addJury")}
        newItem={() => ({ name: "", role: { fr: "", en: "" }, organization: "", photo: null, email: "" })}
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
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" className={`${smallInput} pl-9`} placeholder={t("juryEmail")} aria-label={t("juryEmail")}
                    value={m.email || ""} onChange={(e) => update({ email: e.target.value })} />
                </div>
                <p className="text-xs text-slate-500">{t("juryEmailHint")}</p>
                <AccountStatus member={m} onError={onError} />
              </div>
            </div>
          </div>
        )}
      />
      <button type="submit" className={`${btn.primary} self-end`}>{t("save")}</button>
    </form>
  );
}