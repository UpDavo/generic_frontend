import API_BASE_URL from "@/config/apiConfig";

/**
 * Crear un nuevo dato manual anual (total o por ciudad)
 * @param {string} accessToken - Token de autenticación
 * @param {Object} data - Datos del registro manual
 * @param {number} data.year - Año del registro
 * @param {number} data.start_week - Semana inicial
 * @param {number} data.end_week - Semana final
 * @param {string} data.report_type - Tipo de reporte ("hectolitros" o "caja")
 * @param {string|null} data.city - Ciudad (null para totales)
 * @param {number} data.value - Valor del registro
 */
export const createManualYearlyData = async (accessToken, data) => {
  const response = await fetch(`${API_BASE_URL}/tada/manual-yearly-data/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Error al crear el dato manual");
  }

  return await response.json();
};

/**
 * Actualizar un dato manual anual existente
 * @param {string} accessToken - Token de autenticación
 * @param {number} id - ID del registro a actualizar
 * @param {Object} data - Datos a actualizar
 * @param {number} data.value - Nuevo valor
 */
export const updateManualYearlyData = async (accessToken, id, data) => {
  const response = await fetch(`${API_BASE_URL}/tada/manual-yearly-data/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Error al actualizar el dato manual");
  }

  return await response.json();
};

/**
 * Eliminar un dato manual anual
 * @param {string} accessToken - Token de autenticación
 * @param {number} id - ID del registro a eliminar
 */
export const deleteManualYearlyData = async (accessToken, id) => {
  const response = await fetch(`${API_BASE_URL}/tada/manual-yearly-data/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Error al eliminar el dato manual");
  }

  return "OK";
};
