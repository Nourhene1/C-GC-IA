import Edition from "../models/Edition.js";

export const getCurrentEdition = () => Edition.findOne({ isCurrent: true });

// F2.5 : les inscriptions sont-elles ouvertes en ce moment ?
export function isRegistrationOpen(edition, now = new Date()) {
  if (!edition) return false;
  const { registrationOpen, registrationClose } = edition.dates;
  return now >= registrationOpen && now <= registrationClose;
}
