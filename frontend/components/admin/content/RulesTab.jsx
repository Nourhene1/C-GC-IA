"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileUp, FileText, Trash2 } from "lucide-react";
import BilingualField from "@/components/admin/BilingualField";
import { btn } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";

// F3.1 : règlement (texte + PDF)
export default function RulesTab({ content, onSave, onContentChange, onError }) {
  const t = useTranslations("adminContent");
  const fileInput = useRef(null);
  const [text, setText] = useState(content.rules?.content || { fr: "", en: "" });
  const [uploading, setUploading] = useState(false);
  const rules = content.rules || {};

  const uploadPdf = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return onError("FILE_TOO_LARGE");
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    try {
      const res = await api("/api/admin/content/rules-pdf", { method: "POST", body: data });
      onContentChange({ rules: res.rules });
    } catch (err) {
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const removePdf = async () => {
    try {
      const res = await api("/api/admin/content/rules-pdf", { method: "DELETE" });
      onContentChange({ rules: res.rules });
    } catch (err) {
      onError(err);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ rules: { content: text } }); }} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4">
        <FileText className="size-8 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">{t("rulesPdf")}</p>
          {rules.pdf ? (
            <a href={publicFileUrl(rules.pdf)} target="_blank" rel="noopener noreferrer"
              className="break-all text-sm text-accent hover:underline">{rules.pdfName || rules.pdf}</a>
          ) : (
            <p className="text-sm text-slate-500">{t("noPdf")}</p>
          )}
        </div>
        <input ref={fileInput} type="file" accept=".pdf" className="hidden" onChange={uploadPdf} />
        <button type="button" onClick={() => fileInput.current.click()} disabled={uploading} className={btn.outline}>
          <FileUp className="size-4" /> {uploading ? t("uploading") : rules.pdf ? t("replacePdf") : t("addPdf")}
        </button>
        {rules.pdf && (
          <button type="button" onClick={removePdf} className={btn.danger}><Trash2 className="size-4" /></button>
        )}
      </div>

      <BilingualField label={t("rulesText")} value={text} onChange={setText} multiline />
      <p className="-mt-3 text-xs text-slate-500">{t("formatHint")}</p>

      <button type="submit" className={`${btn.primary} self-end`}>
        {t("save")}
      </button>
    </form>
  );
}
