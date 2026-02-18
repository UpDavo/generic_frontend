import { ENV } from "@/config/env";

/**
 * Obtiene el reporte de ventas en hectolitros por POC
 * @param {string} token - Token de autenticación
 * @param {string} startDate - Fecha inicial YYYY-MM-DD
 * @param {string} endDate - Fecha final YYYY-MM-DD
 * @param {string} reportType - Tipo de reporte ("hectolitros" | "caja")
 * @param {boolean} groupByCity - Agrupar resultados por ciudad
 * @returns {Promise<Object>} - Datos del reporte
 */
export const getVentaHectoPoc = async (
    token,
    startDate = "",
    endDate = "",
    reportType = "hectolitros",
    groupByCity = false
) => {
    const url = new URL(`${ENV.API_URL}/tada/venta-hecto-por-poc/`);

    if (startDate) url.searchParams.append("start_date", startDate);
    if (endDate) url.searchParams.append("end_date", endDate);
    if (reportType) url.searchParams.append("report_type", reportType);
    url.searchParams.append("group_by_city", groupByCity);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Error al obtener el reporte de ventas por POC");
    }

    return await response.json();
};

/**
 * Descarga el reporte de ventas en hectolitros por POC en formato Excel
 * @param {string} token - Token de autenticación
 * @param {string} startDate - Fecha inicial YYYY-MM-DD
 * @param {string} endDate - Fecha final YYYY-MM-DD
 * @param {string} reportType - Tipo de reporte ("hectolitros" | "caja")
 * @param {boolean} groupByCity - Agrupar resultados por ciudad
 * @returns {Promise<void>} - Descarga el archivo automáticamente
 */
export const downloadVentaHectoPoc = async (
    token,
    startDate = "",
    endDate = "",
    reportType = "hectolitros",
    groupByCity = false
) => {
    const url = new URL(`${ENV.API_URL}/tada/venta-hecto-por-poc/download/`);

    if (startDate) url.searchParams.append("start_date", startDate);
    if (endDate) url.searchParams.append("end_date", endDate);
    if (reportType) url.searchParams.append("report_type", reportType);
    url.searchParams.append("group_by_city", groupByCity);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Error al descargar el reporte de ventas por POC");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;

    // Intentar obtener el nombre del archivo desde los headers
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `venta_hecto_poc_${reportType}_${startDate}_${endDate}.xlsx`;
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
};
