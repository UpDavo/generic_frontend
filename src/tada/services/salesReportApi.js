import API_BASE_URL from "@/config/apiConfig";

/**
 * Procesa un archivo Excel y descarga el resultado
 * @param {string} accessToken - Token de autenticación
 * @param {File} excelFile - Archivo Excel a procesar
 * @returns {Promise<Object>} - Retorna las estadísticas del procesamiento y descarga el archivo
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

    // Extraer estadísticas de los headers HTTP
    const stats = {
        recordsCreated: parseInt(response.headers.get('X-Records-Created') || '0'),
        recordsUpdated: parseInt(response.headers.get('X-Records-Updated') || '0'),
        recordsDuplicated: parseInt(response.headers.get('X-Records-Duplicated') || '0'),
        totalProcessed: parseInt(response.headers.get('X-Total-Processed') || '0'),
        recordsUnprocessed: parseInt(response.headers.get('X-Records-Unprocessed') || '0'),
        processingTime: parseFloat(response.headers.get('X-Processing-Time') || '0'),
    };

    // Obtener el blob (archivo Excel binario)
    const blob = await response.blob();
    
    // Obtener el nombre del archivo desde el header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'reporte_ventas_consolidado.xlsx';
    
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
            filename = filenameMatch[1];
        }
    }
    
    // Crear URL temporal y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Retornar las estadísticas con información sobre errores
    return {
        ...stats,
        hasErrors: stats.recordsUnprocessed > 0,
        filename,
    };
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
 * Obtiene información del último archivo cargado
 * @param {string} accessToken - Token de autenticación
 * @returns {Promise<Object>}
 */
export const getLastSalesUpload = async (accessToken) => {
    const response = await fetch(`${API_BASE_URL}/tada/sales-upload/last/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Error al obtener información de la última carga");
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
