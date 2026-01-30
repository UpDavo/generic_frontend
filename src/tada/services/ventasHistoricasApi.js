import { ENV } from "@/config/env";

/**
 * Obtener historial de ventas con filtros y paginación
 * @param {string} token - Token de autenticación
 * @param {number} page - Número de página
 * @param {string} startDate - Fecha inicial YYYY-MM-DD
 * @param {string} endDate - Fecha final YYYY-MM-DD
 * @param {string} pocName - Nombre del POC (búsqueda parcial)
 * @param {string} skuVtex - SKU VTEX exacto
 * @param {number} pageSize - Cantidad de registros por página
 * @returns {Promise<Object>} - Respuesta con count, next, previous, results
 */
export async function listVentasHistoricas(
    token,
    page = 1,
    startDate = "",
    endDate = "",
    pocName = "",
    skuVtex = "",
    pageSize = 10
) {
    const url = new URL(`${ENV.API_URL}/tada/sales-record/history/`);

    if (page) url.searchParams.append("page", page);
    if (pageSize) url.searchParams.append("page_size", pageSize);
    if (startDate) url.searchParams.append("start_date", startDate);
    if (endDate) url.searchParams.append("end_date", endDate);
    if (pocName) url.searchParams.append("poc_name", pocName);
    if (skuVtex) url.searchParams.append("sku_vtex", skuVtex);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener historial de ventas");
    }

    return await response.json();
}

/**
 * Descargar historial de ventas en Excel con filtros aplicados
 * @param {string} token - Token de autenticación
 * @param {string} startDate - Fecha inicial YYYY-MM-DD
 * @param {string} endDate - Fecha final YYYY-MM-DD
 * @param {string} pocName - Nombre del POC (búsqueda parcial)
 * @param {string} skuVtex - SKU VTEX exacto
 * @returns {Promise<void>} - Descarga el archivo automáticamente
 */
export async function downloadVentasHistoricas(
    token,
    startDate = "",
    endDate = "",
    pocName = "",
    skuVtex = ""
) {
    const url = new URL(`${ENV.API_URL}/tada/sales-record/history/download/`);

    if (startDate) url.searchParams.append("start_date", startDate);
    if (endDate) url.searchParams.append("end_date", endDate);
    if (pocName) url.searchParams.append("poc_name", pocName);
    if (skuVtex) url.searchParams.append("sku_vtex", skuVtex);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al descargar historial de ventas");
    }

    // Crear blob y descargar
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Extraer nombre del archivo de los headers o usar uno por defecto
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "historico_ventas.xlsx";

    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
        }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Eliminar registros de ventas por rango de fechas (optimizado con SQL directo)
 * @param {string} token - Token de autenticación
 * @param {string} startDate - Fecha inicial YYYY-MM-DD (requerida)
 * @param {string} endDate - Fecha final YYYY-MM-DD (requerida)
 * @returns {Promise<Object>} - Respuesta con message, records_deleted, date_range_days
 */
export async function deleteVentasHistoricasByDateRange(
    token,
    startDate,
    endDate
) {
    if (!startDate || !endDate) {
        throw new Error("Las fechas inicial y final son requeridas");
    }

    const url = new URL(`${ENV.API_URL}/tada/sales-record/delete-by-date-optimized/`);
    url.searchParams.append("start_date", startDate);
    url.searchParams.append("end_date", endDate);

    const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al eliminar registros de ventas");
    }

    return await response.json();
}

/**
 * Obtener estadísticas de ventas históricas (para payments/métricas)
 * @param {string} token - Token de autenticación
 * @param {string} startDate - Fecha inicial YYYY-MM-DD
 * @param {string} endDate - Fecha final YYYY-MM-DD
 * @returns {Promise<Object>} - Respuesta con period, summary, details
 */
export async function getSalesCheckStats(token, startDate = "", endDate = "") {
    const url = new URL(`${ENV.API_URL}/tada/sales-record/history/stats/`);

    if (startDate) url.searchParams.append("start_date", startDate);
    if (endDate) url.searchParams.append("end_date", endDate);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener estadísticas de ventas");
    }

    return await response.json();
}

/**
 * Obtener reporte semanal de hectolitros
 * @param {string} token - Token de autenticación
 * @param {number} startYear - Año inicial (ej: 2026)
 * @param {number} endYear - Año final (ej: 2026)
 * @param {number} startWeek - Semana inicial (1-53)
 * @param {number} endWeek - Semana final (1-53)
 * @param {string} reportType - Tipo de reporte: "hectolitros" o "caja" (default: "hectolitros")
 * @returns {Promise<Object>} - Respuesta con total y datos por semana
 */
export async function getWeeklyHectolitresReport(
    token,
    startYear,
    endYear,
    startWeek,
    endWeek,
    reportType = "hectolitros"
) {
    const url = new URL(`${ENV.API_URL}/tada/hectolitres-daily-meta/weekly-report/`);
    
    if (startYear) url.searchParams.append("start_year", startYear);
    if (endYear) url.searchParams.append("end_year", endYear);
    if (startWeek) url.searchParams.append("start_week", startWeek);
    if (endWeek) url.searchParams.append("end_week", endWeek);
    if (reportType) url.searchParams.append("report_type", reportType);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener reporte de hectolitros");
    }

    return await response.json();
}

/**
 * Descargar reporte semanal de hectolitros en Excel
 * @param {string} token - Token de autenticación
 * @param {number} startYear - Año inicial (ej: 2026)
 * @param {number} endYear - Año final (ej: 2026)
 * @param {number} startWeek - Semana inicial (1-53)
 * @param {number} endWeek - Semana final (1-53)
 * @param {string} reportType - Tipo de reporte: "hectolitros" o "caja" (default: "hectolitros")
 * @returns {Promise<void>} - Descarga el archivo automáticamente
 */
export async function downloadWeeklyHectolitresReport(
    token,
    startYear,
    endYear,
    startWeek,
    endWeek,
    reportType = "hectolitros"
) {
    const url = new URL(`${ENV.API_URL}/tada/hectolitres-daily-meta/weekly-report/download/`);
    
    if (startYear) url.searchParams.append("start_year", startYear);
    if (endYear) url.searchParams.append("end_year", endYear);
    if (startWeek) url.searchParams.append("start_week", startWeek);
    if (endWeek) url.searchParams.append("end_week", endWeek);
    if (reportType) url.searchParams.append("report_type", reportType);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al descargar reporte de hectolitros");
    }

    // Crear blob y descargar
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    
    // Extraer nombre del archivo de los headers o usar uno por defecto
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "reporte_hectolitros.xlsx";
    
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
        }
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
}
