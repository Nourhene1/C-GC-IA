"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  UserPlus,
  Pencil,
  Trash2,
  Send,
  Crown,
  CircleCheck,
  MailQuestion,
  TriangleAlert,
  Users,
  X,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import Field from "@/components/ui/Field";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { api } from "@/lib/api";

const ETABLISSEMENTS = [
  "ISET Siliana",
  "ISET Gafsa",
  "ISET Nabeul",
  "ISET Radès",
  "ISET Médenine",
  "ISET Tozeur",
  "ISET Sfax",
  "ISSAT Sousse",
  "ISSAT Gabès",
  "IIT",
  "IPSAS",
];

const FILIERES = ["IT", "GC"];

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2", "ING 1", "ING 2", "ING3"];

const EMPTY = { nom: "", prenom: "", email: "", etablissement: "", niveau: "", filiere: "" };

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// Ajoute la valeur courante si elle n'est pas dans la liste (anciens membres)
const withCurrent = (list, current) =>
  current && !list.includes(current) ? [current, ...list] : list;

// Formulaire d'ajout ou de modification d'un membre
function MemberForm({ initial, isNew, onCancel, onSubmit }) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const tTeam = useTranslations("team");
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const filiereOptions = withCurrent(FILIERES, form.filiere);
  const niveauOptions = withCurrent(NIVEAUX, form.niveau);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const suffix = isNew ? "new" : "edit";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent-light/40 p-4"
    >
      {isNew && (
        <div>
          <p className="font-semibold text-primary">{t("addTitle")}</p>
          <p className="text-xs text-slate-500">{t("addHint")}</p>
        </div>
      )}

      <ErrorAlert error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("nom")}
          name="nom"
          value={form.nom}
          onChange={handleChange}
          required
        />

        <Field
          label={t("prenom")}
          name="prenom"
          value={form.prenom}
          onChange={handleChange}
          required
        />

        <Field
          label={t("email")}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          disabled={!isNew}
          hint={!isNew ? t("emailLocked") : undefined}
          className="sm:col-span-2"
        />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label
            htmlFor={`member-etablissement-${suffix}`}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Building2 className="size-4" /> {tTeam("etablissement")}
          </label>
          <select
            id={`member-etablissement-${suffix}`}
            name="etablissement"
            value={form.etablissement}
            onChange={handleChange}
            required
            className={selectClass}
          >
            <option value="" disabled>
              {tTeam("etablissementPlaceholder")}
            </option>
            {ETABLISSEMENTS.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`member-niveau-${suffix}`}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <BookOpen className="size-4" /> {t("niveau")}
          </label>
          <select
            id={`member-niveau-${suffix}`}
            name="niveau"
            value={form.niveau}
            onChange={handleChange}
            required
            className={selectClass}
          >
            <option value="" disabled>
              {t("niveauPlaceholder")}
            </option>
            {niveauOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`member-filiere-${suffix}`}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <GraduationCap className="size-4" /> {t("filiere")}
          </label>
          <select
            id={`member-filiere-${suffix}`}
            name="filiere"
            value={form.filiere}
            onChange={handleChange}
            required
            className={selectClass}
          >
            <option value="" disabled>
              {t("filierePlaceholder")}
            </option>
            {filiereOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={btn.outline}>
          {tc("cancel")}
        </button>

        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? tc("saving") : isNew ? t("add") : tc("save")}
        </button>
      </div>
    </form>
  );
}

// F2.3 : membres de l'équipe
export default function MembersSection({ team, canEdit, onChange }) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const { min, max } = team.edition.teamSize;

  const [mode, setMode] = useState(null); // null | "add" | id du membre en modification
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const addMember = async (form) => {
    await api("/api/teams/me/members", {
      method: "POST",
      body: form,
    });

    setMode(null);
    await onChange();
  };

  // L'email ne se modifie pas : on l'exclut du body
  const updateMember = (id) => async (form) => {
    const { email, ...body } = form;

    await api(`/api/teams/me/members/${id}`, {
      method: "PUT",
      body,
    });

    setMode(null);
    await onChange();
  };

  const removeMember = async (m) => {
    setError(null);

    try {
      await api(`/api/teams/me/members/${m._id}`, {
        method: "DELETE",
      });

      setMemberToRemove(null);
      await onChange();
    } catch (err) {
      setError(err);
    }
  };

  const resend = async (m) => {
    setError(null);

    try {
      await api(`/api/teams/me/members/${m._id}/resend`, {
        method: "POST",
      });

      setNotice(m._id);
    } catch (err) {
      setError(err);
    }
  };

  const isFull = team.members.length >= max;

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={sectionTitle}>
          <Users className="size-5 text-accent" />
          {t("title")}
        </h2>

        <span className="text-sm font-semibold text-slate-500">
          {t("count", {
            count: team.members.length,
            min,
            max,
          })}
        </span>
      </div>

      <ErrorAlert error={error} className="mt-4" />

      <ul className="mt-4 divide-y divide-slate-100">
        {team.members.map((m) => {
          const verified = m.user?.isVerified;
          const incomplete = !m.etablissement || !m.niveau || !m.filiere;

          if (mode === m._id) {
            return (
              <li key={m._id} className="py-3">
                <MemberForm
                  initial={{
                    nom: m.nom,
                    prenom: m.prenom,
                    email: m.email,
                    etablissement: m.etablissement || "",
                    niveau: m.niveau || "",
                    filiere: m.filiere || "",
                  }}
                  onCancel={() => setMode(null)}
                  onSubmit={updateMember(m._id)}
                />
              </li>
            );
          }

          return (
            <li
              key={m._id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
                {m.prenom[0]}
                {m.nom[0]}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {m.prenom} {m.nom}

                  {m.isChef && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-xs font-bold text-accent">
                      <Crown className="size-3" />
                      {t("chef")}
                    </span>
                  )}
                </p>

                <p className="truncate text-sm text-slate-500">{m.email}</p>

                <p className="text-sm text-slate-600">
                  {incomplete ? (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <TriangleAlert className="size-3.5" />
                      {t("incomplete")}
                    </span>
                  ) : (
                    `${m.etablissement} · ${m.niveau} · ${m.filiere}`
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                {!m.isChef &&
                  (verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                      <CircleCheck className="size-3.5" />
                      {t("active")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <MailQuestion className="size-3.5" />
                      {notice === m._id ? t("resent") : t("invited")}
                    </span>
                  ))}

                {canEdit && !m.isChef && !verified && notice !== m._id && (
                  <button
                    onClick={() => resend(m)}
                    className={btn.ghost}
                    title={t("resend")}
                    aria-label={t("resend")}
                  >
                    <Send className="size-4" />
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => setMode(m._id)}
                    className={btn.ghost}
                    title={tc("edit")}
                    aria-label={tc("edit")}
                  >
                    <Pencil className="size-4" />
                  </button>
                )}

                {canEdit && !m.isChef && (
                  <button
                    onClick={() => setMemberToRemove(m)}
                    className={btn.danger}
                    title={tc("delete")}
                    aria-label={tc("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {canEdit && (
        <div className="mt-4">
          {mode === "add" ? (
            <MemberForm
              initial={EMPTY}
              isNew
              onCancel={() => setMode(null)}
              onSubmit={addMember}
            />
          ) : isFull ? (
            <Alert type="info">{t("full")}</Alert>
          ) : (
            <button onClick={() => setMode("add")} className={btn.outline}>
              <UserPlus className="size-4" />
              {t("add")}
            </button>
          )}
        </div>
      )}

      {memberToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-member-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="delete-member-title" className="text-lg font-bold text-ink">
                  {tc("delete")}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("confirmRemove", {
                    name: `${memberToRemove.prenom} ${memberToRemove.nom}`,
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={tc("cancel")}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className={btn.outline}
              >
                {tc("cancel")}
              </button>

              <button
                type="button"
                onClick={() => removeMember(memberToRemove)}
                className={btn.danger}
              >
                <Trash2 className="size-4" />
                {tc("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}