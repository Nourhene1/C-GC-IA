"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "../auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../notifications";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();

      // L'utilisateur n'est pas encore authentifié.
      // On ne fait pas l'appel API.
      if (!token) {
        setNotifications([]);
        return;
      }

      const data = await getNotifications();

      setNotifications(
        Array.isArray(data)
          ? data
          : data?.notifications || []
      );
    } catch (err) {
      console.error(
        "Erreur lors du chargement des notifications :",
        err
      );

      // Si le backend indique que le token n'est plus valide,
      // on évite de garder une ancienne liste.
      if (
        err?.code === "UNAUTHENTICATED" ||
        err?.code === "UNAUTHORIZED"
      ) {
        setNotifications([]);
      }

      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      return;
    }

    try {
      await markNotificationAsRead(notificationId);

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => {
          const id = notification._id || notification.id;

          if (id !== notificationId) {
            return notification;
          }

          return {
            ...notification,
            readAt: new Date().toISOString(),
            read: true,
            isRead: true,
          };
        })
      );
    } catch (err) {
      console.error(
        "Erreur lors de la lecture de la notification :",
        err
      );

      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date().toISOString(),
          read: true,
          isRead: true,
        }))
      );
    } catch (err) {
      console.error(
        "Erreur lors de la lecture des notifications :",
        err
      );

      throw err;
    }
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    if (!notificationId) {
      return;
    }

    try {
      await deleteNotification(notificationId);

      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => {
          const id = notification._id || notification.id;
          return id !== notificationId;
        })
      );
    } catch (err) {
      // Déjà supprimée côté serveur : on la retire simplement de la liste
      if (err?.code === "NOT_FOUND") {
        setNotifications((currentNotifications) =>
          currentNotifications.filter(
            (notification) =>
              (notification._id || notification.id) !== notificationId
          )
        );
        return;
      }

      console.error(
        "Erreur lors de la suppression de la notification :",
        err
      );

      throw err;
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(
    (notification) =>
      !notification.readAt &&
      !notification.read &&
      !notification.isRead
  ).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    setNotifications,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}