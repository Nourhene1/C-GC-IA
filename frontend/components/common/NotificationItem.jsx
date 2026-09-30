"use client";

import {
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}) {
  const t = useTranslations("notifications");
  const locale = useLocale();

  // Champs multilingues renvoyés par l'API sous la forme { fr, en }
  const tr = (value) =>
    value && typeof value === "object"
      ? value[locale] || value.fr || value.en || ""
      : value || "";

  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const notificationId =
    notification?._id || notification?.id;

  const isRead =
    Boolean(notification?.readAt) ||
    notification?.read === true ||
    notification?.isRead === true;

  const title =
    tr(notification?.title) ||
    notification?.type ||
    t("defaultTitle");

  const message =
    tr(notification?.body) ||
    tr(notification?.message) ||
    tr(notification?.description) ||
    "";

  const createdAt =
    notification?.createdAt ||
    notification?.date ||
    notification?.timestamp;

  const handleMarkAsRead = async () => {
    if (!notificationId || isRead || markingAsRead) {
      return;
    }

    try {
      setMarkingAsRead(true);
      await onMarkAsRead?.(notificationId);
    } catch (error) {
      console.error(
        "Erreur lors de la lecture de la notification :",
        error
      );
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleDelete = async () => {
    if (!notificationId || deleting) {
      return;
    }

    try {
      setDeleting(true);
      await onDelete?.(notificationId);
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de la notification :",
        error
      );
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(locale)
    : null;

  return (
    <div
      className={`group px-4 py-4 transition ${
        isRead
          ? "bg-white"
          : "bg-gray-50"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
            isRead ? "bg-gray-300" : "bg-gray-900"
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`text-sm ${
                isRead
                  ? "font-medium text-gray-700"
                  : "font-semibold text-gray-900"
              }`}
            >
              {title}
            </h3>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || markingAsRead}
              aria-label={t("delete")}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>

          {message && (
            <p className="mt-1 text-sm leading-5 text-gray-600">
              {message}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            {formattedDate ? (
              <span className="text-xs text-gray-400">
                {formattedDate}
              </span>
            ) : (
              <span />
            )}

            {!isRead && (
              <button
                type="button"
                onClick={handleMarkAsRead}
                disabled={markingAsRead || deleting}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingAsRead ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}

                {t("markRead")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}