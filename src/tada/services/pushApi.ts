import API_BASE_URL from "@/config/apiConfig";
import { Message, SendPush } from "@/tada/interfaces/message";

export const getPrice = async (accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/tada/prices/last/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los mensajes");
  }

  return await response.json();
};

export const listMessages = async (
  accessToken: string | null,
  page: number = 1,
  name: string | null = null // Nuevo parámetro opcional
) => {
  const params = new URLSearchParams({ page: page.toString() });

  if (name) {
    params.append("name", name);
  }

  const response = await fetch(
    `${API_BASE_URL}/tada/notifications/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los mensajes");
  }

  return await response.json();
};

export const listLogs = async (
  accessToken: string | null,
  page: number = 1,
  sentAt: string | null = null, // Fecha exacta
  sentAtGte: string | null = null, // Fecha desde
  sentAtLte: string | null = null, // Fecha hasta
  users: string[] = [] // Lista de emails de usuarios
) => {
  const params = new URLSearchParams({ page: page.toString() });

  if (sentAt) {
    params.append("sent_at", sentAt);
  }
  if (sentAtGte) {
    params.append("sent_at__gte", sentAtGte);
  }
  if (sentAtLte) {
    params.append("sent_at__lte", sentAtLte);
  }
  if (users.length > 0) {
    users.forEach((user) => params.append("user", user));
  }

  const response = await fetch(
    `${API_BASE_URL}/tada/notification-logs/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los logs");
  }

  return await response.json();
};

export const downloadLogsExcel = async (
  accessToken: string,
  sentAtGte: string | null = null,
  sentAtLte: string | null = null,
  users: string[] = []
) => {
  const params = new URLSearchParams();

  if (sentAtGte) params.append("sent_at__gte", sentAtGte);
  if (sentAtLte) params.append("sent_at__lte", sentAtLte);
  users.forEach((u) => params.append("user", u));

  const response = await fetch(
    `${API_BASE_URL}/tada/notification-logs/report/download?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) throw new Error("Error al descargar el Excel");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // yyyy-mm-dd
  a.download = `notification_logs_${formattedDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const listLogsReport = async (
  accessToken: string | null,
  sentAt: string | null = null, // Fecha exacta
  sentAtGte: string | null = null, // Fecha desde
  sentAtLte: string | null = null, // Fecha hasta
  users: string[] = [] // Lista de emails de usuarios
) => {
  const params = new URLSearchParams();

  if (sentAt) {
    params.append("sent_at", sentAt);
  }
  if (sentAtGte) {
    params.append("sent_at__gte", sentAtGte);
  }
  if (sentAtLte) {
    params.append("sent_at__lte", sentAtLte);
  }
  if (users.length > 0) {
    users.forEach((user) => params.append("user", user));
  }

  const response = await fetch(
    `${API_BASE_URL}/tada/notification-logs/report/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los logs");
  }

  return await response.json();
};

export const createMessage = async (
  message: Message,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/tada/notifications/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });

  const returned = await response.json();
  // console.log(returned);
  return returned;
};

export const updateMessage = async (
  id: number,
  message: Message,
  accessToken: string | null
) => {
  console.log(message);
  const response = await fetch(`${API_BASE_URL}/tada/notifications/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });

  const returned = await response.json();
  // console.log(returned);
  return returned;
};

export const deleteMessage = async (id: number, accessToken: string | null) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const response = await fetch(`${API_BASE_URL}/tada/notifications/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return "OK";
};

export const sendMessage = async (
  sendObject: SendPush,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/tada/send/push/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(sendObject),
  });

  const returned = await response.json();
  // console.log(returned);
  return returned;
};
