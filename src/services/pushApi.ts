import API_BASE_URL from "../config/apiConfig";
import { Message, SendPush } from "@/interfaces/message";

export const listMessages = async (
  accessToken: string | null,
  page: number = 1
) => {
  const response = await fetch(
    `${API_BASE_URL}/tada/notifications/?page=${page}`,
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

  const returned = await response.json();
  console.log(returned);
  return returned;
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
  console.log(returned);
  return returned;
};

export const updateMessage = async (
  id: number,
  message: Message,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/tada/notifications/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });

  const returned = await response.json();
  console.log(returned);
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
  return 'OK';
};

export const sendMessage = async (
  sendObject: SendPush,
  accessToken: string
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
  console.log(returned);
  return returned;
};
