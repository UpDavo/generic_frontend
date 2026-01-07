import API_BASE_URL from "@/config/apiConfig";

const API_URL = API_BASE_URL;

/**
 * Listar SKUs con filtros y paginación
 */
export const listSkus = async (
  accessToken,
  page = 1,
  type = null,
  active = null,
  vendorCode = null,
  skuVtex = null,
  search = null,
  pageSize = 10
) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (pageSize) params.append("page_size", pageSize);
  if (type) params.append("type", type);
  if (active !== null) params.append("active", active);
  if (vendorCode) params.append("vendor_code", vendorCode);
  if (skuVtex) params.append("sku_vtex", skuVtex);
  if (search) params.append("search", search);

  const response = await fetch(`${API_URL}/tada/skus/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los SKUs");
  }

  return response.json();
};

/**
 * Obtener un SKU por ID
 */
export const getSkuById = async (accessToken, id) => {
  const response = await fetch(`${API_URL}/tada/skus/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener el SKU");
  }

  return response.json();
};

/**
 * Crear un nuevo SKU
 */
export const createSku = async (accessToken, skuData) => {
  const response = await fetch(`${API_URL}/tada/skus/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(skuData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al crear el SKU");
  }

  return response.json();
};

/**
 * Actualizar un SKU (PUT - completo)
 */
export const updateSku = async (accessToken, id, skuData) => {
  const response = await fetch(`${API_URL}/tada/skus/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(skuData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al actualizar el SKU");
  }

  return response.json();
};

/**
 * Actualizar un SKU parcialmente (PATCH)
 */
export const patchSku = async (accessToken, id, skuData) => {
  const response = await fetch(`${API_URL}/tada/skus/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(skuData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error al actualizar el SKU");
  }

  return response.json();
};

/**
 * Eliminar un SKU
 */
export const deleteSku = async (accessToken, id) => {
  const response = await fetch(`${API_URL}/tada/skus/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el SKU");
  }

  return true;
};

/**
 * Carga masiva de SKUs desde Excel
 */
export const bulkCreateSkusFromExcel = async (accessToken, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/tada/skus/bulk-create-excel/`, {
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
 * Buscar SKUs por término de búsqueda
 */
export const searchSkus = async (accessToken, searchTerm) => {
  const params = new URLSearchParams();
  if (searchTerm) params.append("search", searchTerm);

  const response = await fetch(`${API_URL}/tada/skus/search/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al buscar SKUs");
  }

  return response.json();
};

/**
 * Descargar plantilla de Excel para SKUs
 */
export const downloadSkusTemplate = async (accessToken) => {
  const response = await fetch(`${API_URL}/tada/skus/download-template/`, {
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
  a.download = "plantilla_skus.xlsx";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
