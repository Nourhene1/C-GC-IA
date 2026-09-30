import { api } from "./api";

export const getNotifications = async () => {
  return api("/api/notifications");
};

export const markNotificationAsRead = async (notificationId) => {
  return api(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
};

export const markAllNotificationsAsRead = async () => {
  return api("/api/notifications/read-all", { method: "PATCH" });
};

export const deleteNotification = async (notificationId) => {
  return api(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
};