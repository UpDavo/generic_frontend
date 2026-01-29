import { ENV } from "@/config/env";

/**
 * Buscar tickets con filtros y paginación
 * @param {string} token - Token de autenticación
 * @param {number} page - Número de página
 * @param {string} search - Búsqueda general
 * @param {string} idTicket - ID del ticket
 * @param {boolean} esTienda - Filtro por es_tienda
 * @param {number} pageSize - Cantidad de registros por página
 * @param {string} fechaInicio - Fecha inicial (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha final (YYYY-MM-DD)
 * @returns {Promise<Object>} - Respuesta con count, next, previous, results
 */
export async function searchTicketSupports(
    token,
    page = 1,
    search = "",
    idTicket = "",
    esTienda = null,
    pageSize = 10,
    fechaInicio = "",
    fechaFin = ""
) {
    const url = new URL(`${ENV.API_URL}/tada/negativos-justificacion/search/`);

    if (page) url.searchParams.append("page", page);
    if (pageSize) url.searchParams.append("page_size", pageSize);
    if (search) url.searchParams.append("search", search);
    if (idTicket) url.searchParams.append("id_ticket", idTicket);
    if (esTienda !== null) url.searchParams.append("es_tienda", esTienda);
    if (fechaInicio) url.searchParams.append("fecha_inicio", fechaInicio);
    if (fechaFin) url.searchParams.append("fecha_fin", fechaFin);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener tickets");
    }

    return await response.json();
}

/**
 * Obtener un ticket por ID
 * @param {string} token - Token de autenticación
 * @param {number} id - ID del ticket
 * @returns {Promise<Object>} - Datos del ticket
 */
export async function getTicketSupportById(token, id) {
    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/${id}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener el ticket");
    }

    return await response.json();
}

/**
 * Crear un nuevo ticket
 * @param {string} token - Token de autenticación
 * @param {Object} ticketData - Datos del ticket
 * @returns {Promise<Object>} - Ticket creado
 */
export async function createTicketSupport(token, ticketData) {
    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear el ticket");
    }

    return await response.json();
}

/**
 * Actualizar un ticket existente
 * @param {string} token - Token de autenticación
 * @param {number} id - ID del ticket
 * @param {Object} ticketData - Datos actualizados del ticket
 * @returns {Promise<Object>} - Ticket actualizado
 */
export async function updateTicketSupport(token, id, ticketData) {
    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al actualizar el ticket");
    }

    return await response.json();
}

/**
 * Eliminar un ticket
 * @param {string} token - Token de autenticación
 * @param {number} id - ID del ticket a eliminar
 * @returns {Promise<void>}
 */
export async function deleteTicketSupport(token, id) {
    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/${id}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al eliminar el ticket");
    }
}

/**
 * Carga masiva de tickets desde Excel
 * @param {string} token - Token de autenticación
 * @param {File} file - Archivo Excel
 * @returns {Promise<Object>} - Resultado de la carga
 */
export async function bulkCreateTicketSupportsFromExcel(token, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/bulk-create-excel/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al cargar el archivo Excel");
    }

    return await response.json();
}

/**
 * Descargar plantilla Excel para carga masiva
 * @param {string} token - Token de autenticación
 * @returns {Promise<void>} - Descarga el archivo automáticamente
 */
export async function downloadTicketSupportTemplate(token) {
    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/download-template/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al descargar la plantilla");
    }

    // Crear blob y descargar
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Extraer nombre del archivo de los headers o usar uno por defecto
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "plantilla_tickets.xlsx";

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
 * Descargar todos los tickets en Excel
 * @param {string} token - Token de autenticación
 * @returns {Promise<void>} - Descarga el archivo automáticamente
 */
export async function downloadAllTicketSupports(token) {
    const response = await fetch(`${ENV.API_URL}/tada/negativos-justificacion/download-all/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al descargar los tickets");
    }

    // Crear blob y descargar
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Extraer nombre del archivo de los headers o usar uno por defecto
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `tickets_support_${new Date().toISOString().split("T")[0]}.xlsx`;

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
