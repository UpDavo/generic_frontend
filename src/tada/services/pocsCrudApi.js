import API_BASE_URL from "@/config/apiConfig";

const API_URL = API_BASE_URL;

/**
 * Listar POCs con filtros y paginación
 */
export const listPocs = async (
  accessToken,
  page = 1,
  region = null,
  active = null,
  city = null,
  idPoc = null,
  search = null,
  pageSize = 10
) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (pageSize) params.append("page_size", pageSize);
  if (region) params.append("region", region);
  if (active !== null) params.append("active", active);
  if (city) params.append("city", city);
  if (idPoc) params.append("id_poc", idPoc);
  if (search) params.append("search", search);

  const response = await fetch(`${API_URL}/tada/pocs/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los POCs");
  }

  return response.json();
};

/**
 * Obtener un POC por ID
 */
export const getPocById = async (accessToken, id) => {
  const response = await fetch(`${API_URL}/tada/pocs/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener el POC");
  }

  return response.json();
};

/**
 * Crear un nuevo POC
 */
export const createPoc = async (accessToken, pocData) => {
  const response = await fetch(`${API_URL}/tada/pocs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(pocData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al crear el POC");
  }

  return response.json();
};

/**
 * Actualizar un POC (PUT - completo)
 */
export const updatePoc = async (accessToken, id, pocData) => {
  const response = await fetch(`${API_URL}/tada/pocs/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(pocData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al actualizar el POC");
  }

  return response.json();
};

/**
 * Actualizar un POC parcialmente (PATCH)
 */
export const patchPoc = async (accessToken, id, pocData) => {
  const response = await fetch(`${API_URL}/tada/pocs/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(pocData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al actualizar el POC");
  }

  return response.json();
};

/**
 * Eliminar un POC
 */
export const deletePoc = async (accessToken, id) => {
  const response = await fetch(`${API_URL}/tada/pocs/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el POC");
  }

  return true;
};

/**
 * Carga masiva de POCs desde Excel
 */
export const bulkCreatePocsFromExcel = async (accessToken, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/tada/pocs/bulk-create-excel/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al cargar el archivo");
  }

  return response.json();
};

/**
 * Descargar plantilla de Excel para POCs
 */
export const downloadPocsTemplate = async (accessToken) => {
  const response = await fetch(`${API_URL}/tada/pocs/download-template/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al descargar la plantilla");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_pocs.xlsx";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
