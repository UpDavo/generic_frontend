import API_BASE_URL from "@/config/apiConfig";

// Obtener todas las notificaciones
export const getNotifications = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/core/notifications/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener notificaciones");
  }

  return await response.json();
};

// Crear una nueva notificación
export const createNotification = async (accessToken, notificationData) => {
  console.log("Response de crear notificación:", notificationData);

  const response = await fetch(`${API_BASE_URL}/core/notifications/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(notificationData),
  });

  if (!response.ok) {
    console.log("Error al crear notificación:", response);
    throw new Error("Error al crear notificación");
  }

  return await response.json();
};

// Actualizar una notificación existente
export const updateNotification = async (accessToken, id, notificationData) => {
  const response = await fetch(`${API_BASE_URL}/core/notifications/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(notificationData),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar notificación");
  }

  return await response.json();
};

// Eliminar una notificación
export const deleteNotification = async (accessToken, id) => {
  const response = await fetch(`${API_BASE_URL}/core/notifications/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.log("Error al eliminar notificación:", response);
    throw new Error("Error al eliminar notificación");
  }

  return "OK";
};

// Obtener tipos de notificaciones
export const getNotificationTypes = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/core/notification-types/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener tipos de notificaciones");
  }

  return await response.json();
};
