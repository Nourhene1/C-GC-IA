// 1536000 -> "1,5 Mo" (fr) ou "1.5 MB" (en)
export function formatSize(bytes, locale = "fr") {
  if (!bytes && bytes !== 0) return "";
  const units = locale === "en" ? ["B", "KB", "MB"] : ["o", "Ko", "Mo"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toLocaleString(locale, { maximumFractionDigits: 1 })} ${units[i]}`;
}

export const DATE_TIME = { dateStyle: "medium", timeStyle: "short" };
export const DATE_LONG = { dateStyle: "long", timeStyle: "short" };
