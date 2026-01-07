import API_BASE_URL from "@/config/apiConfig";

/**
 * Procesa un archivo Excel y devuelve el resultado
 * @param {string} accessToken - Token de autenticación
 * @param {File} excelFile - Archivo Excel a procesar
 * @returns {Promise<{json_result: object, excel_url: string}>}
 */
export const processSalesReport = async (accessToken, excelFile) => {
    const formData = new FormData();
    formData.append("file", excelFile);

    const response = await fetch(`${API_BASE_URL}/tada/sales-report/process/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Error al procesar el archivo");
    }

    return await response.json();
};

/**
 * Obtiene estadísticas de los logs de reportes de ventas
 * @param {string} accessToken - Token de autenticación
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @param {number} userId - ID del usuario (opcional)
 * @returns {Promise<Object>}
 */
export const getSalesReportLogsStats = async (accessToken, startDate = null, endDate = null, userId = null) => {
    let url = `${API_BASE_URL}/tada/sales-report-logs/stats/`;
    
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (userId) params.append("user_id", userId);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Error al obtener estadísticas de reportes de ventas");
    }

    return await response.json();
};

/**
 * Descarga un archivo desde una URL
 * @param {string} url - URL del archivo
 * @param {string} filename - Nombre del archivo a descargar
 */
export const downloadFileFromUrl = (url, filename = "resultado.xlsx") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
