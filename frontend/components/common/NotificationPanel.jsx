"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationContext } from "@/context/NotificationContext";
import NotificationItem from "./NotificationItem";

export default function NotificationPanel() {
  const t = useTranslations("notifications");

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationContext();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {t("title")}
          </h2>

          {unreadCount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {t("unreadCount", { count: unreadCount })}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <CheckCheck className="h-4 w-4" />
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />

            <p className="mt-3 text-sm text-gray-500">
              {t("loading")}
            </p>
          </div>
        ) : error ? (
          <div className="px-6 py-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-gray-400" />

            <p className="mt-3 text-sm text-red-600">
              {t("error")}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-5 w-5 text-gray-400" />
            </div>

            <p className="mt-4 text-sm font-medium text-gray-900">
              {t("empty.title")}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {t("empty.description")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification, index) => (
              <NotificationItem
                key={
                  notification._id ||
                  notification.id ||
                  `notification-${index}`
                }
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={removeNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}