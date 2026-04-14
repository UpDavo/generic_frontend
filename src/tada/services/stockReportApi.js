import API_BASE_URL from "@/config/apiConfig";

/**
 * Procesa un archivo Excel de inventario teórico y descarga el resultado
 * @param {string} accessToken - Token de autenticación
 * @param {File} excelFile - Archivo Excel con hojas: Inventario PT, Inventario EN, Pedido
 * @param {number|null} year - Año del período (opcional, default: actual)
 * @param {number|null} month - Mes del período (opcional, default: actual)
 * @returns {Promise<string>} - Nombre del archivo descargado
 */
export const processStockReport = async (accessToken, excelFile, year = null, month = null) => {
    const formData = new FormData();
    formData.append("file", excelFile);
    if (year) formData.append("year", year);
    if (month) formData.append("month", month);

    const response = await fetch(`${API_BASE_URL}/tada/teoric-inventory/process/`, {
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

    const blob = await response.blob();

    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "inventario_teorico.xlsx";
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return filename;
};
