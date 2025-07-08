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

// Obtener todos los precios de apps con detalles
export const getAppPricesWithPrice = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/tada/app-prices-with-price/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Error al obtener los precios de apps");
  }
  return await response.json();
};

// Crear un nuevo precio de app
export const createAppPriceWithPrice = async (accessToken, data) => {
  const response = await fetch(`${API_BASE_URL}/tada/app-prices-with-price/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Error al crear el precio de la app");
  }
  return await response.json();
};

// Editar un precio de app existente
export const updateAppPriceWithPrice = async (accessToken, id, data) => {
  console.log(data);
  const response = await fetch(
    `${API_BASE_URL}/tada/app-prices-with-price/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error("Error al actualizar el precio de la app");
  }
  return await response.json();
};
