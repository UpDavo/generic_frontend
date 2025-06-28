import API_BASE_URL from "@/config/apiConfig";

export const getPrice = async (accessToken) => {
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
