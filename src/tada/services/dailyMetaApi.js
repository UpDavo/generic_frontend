import API_BASE_URL from "@/config/apiConfig";

// Obtener todas las daily meta
export const getDailyMetas = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/tada/daily-meta/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener las daily meta");
  }

  return await response.json();
};

// Crear una nueva daily meta
export const createDailyMeta = async (accessToken, dailyMetaData) => {
  const response = await fetch(`${API_BASE_URL}/tada/daily-meta/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dailyMetaData),
  });

  if (!response.ok) {
    throw new Error("Error al crear daily meta");
  }

  return await response.json();
};

// Actualizar una daily meta existente
export const updateDailyMeta = async (accessToken, id, dailyMetaData) => {
  const response = await fetch(`${API_BASE_URL}/tada/daily-meta/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dailyMetaData),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar daily meta");
  }

  return await response.json();
};

// Eliminar una daily meta
export const deleteDailyMeta = async (accessToken, id) => {
  const response = await fetch(`${API_BASE_URL}/tada/daily-meta/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar daily meta");
  }

  return "OK";
};

// Carga masiva de daily metas desde Excel
export const uploadExcelMetas = async (accessToken, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/tada/daily-meta/bulk-create-excel/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al cargar el archivo Excel");
  }

  return await response.json();
};
