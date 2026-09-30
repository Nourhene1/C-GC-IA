"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationContext } from "@/context/NotificationContext";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const t = useTranslations("notifications");

  const {
    unreadCount,
    open,
    togglePanel,
    closePanel,
  } = useNotificationContext();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={togglePanel}
        aria-label={t("open")}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t("close")}
            onClick={closePanel}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-md">
            <NotificationPanel />
          </div>
        </>
      )}
    </div>
  );
}