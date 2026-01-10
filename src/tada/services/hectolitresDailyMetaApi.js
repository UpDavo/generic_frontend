import API_BASE_URL from "@/config/apiConfig";

// Obtener todas las metas diarias de hectolitros
export const getHectolitresDailyMetas = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/tada/hectolitres-daily-meta/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener las metas de hectolitros");
  }

  return await response.json();
};

// Crear una nueva meta diaria de hectolitros
export const createHectolitresDailyMeta = async (accessToken, metaData) => {
  const response = await fetch(`${API_BASE_URL}/tada/hectolitres-daily-meta/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(metaData),
  });

  if (!response.ok) {
    throw new Error("Error al crear meta de hectolitros");
  }

  return await response.json();
};

// Actualizar una meta diaria de hectolitros existente
export const updateHectolitresDailyMeta = async (accessToken, id, metaData) => {
  const response = await fetch(`${API_BASE_URL}/tada/hectolitres-daily-meta/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(metaData),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar meta de hectolitros");
  }

  return await response.json();
};

// Eliminar una meta diaria de hectolitros
export const deleteHectolitresDailyMeta = async (accessToken, id) => {
  const response = await fetch(`${API_BASE_URL}/tada/hectolitres-daily-meta/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar meta de hectolitros");
  }

  return "OK";
};

// Carga masiva de metas de hectolitros desde Excel
export const uploadExcelHectolitresMetas = async (accessToken, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/tada/hectolitres-daily-meta/bulk-create-excel/`,
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
