import API_BASE_URL from "@/config/apiConfig";

const API_URL = API_BASE_URL;

/**
 * Listar Productos App con filtros y paginación
 */
export const listProductosApp = async (
    accessToken,
    page = 1,
    type = null,
    code = null,
    name = null,
    search = null,
    pageSize = 10
) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (pageSize) params.append("page_size", pageSize);
    if (type) params.append("type", type);
    if (code) params.append("code", code);
    if (name) params.append("name", name);
    if (search) params.append("search", search);

    const response = await fetch(`${API_URL}/tada/ventas-productos-app/?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener los Productos App");
    }

    return response.json();
};

/**
 * Obtener un Producto App por ID
 */
export const getProductoAppById = async (accessToken, id) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-app/${id}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener el Producto App");
    }

    return response.json();
};

/**
 * Crear un nuevo Producto App
 */
export const createProductoApp = async (accessToken, productoData) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-app/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productoData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al crear el Producto App");
    }

    return response.json();
};

/**
 * Actualizar un Producto App (PUT - completo)
 */
export const updateProductoApp = async (accessToken, id, productoData) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-app/${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productoData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al actualizar el Producto App");
    }

    return response.json();
};

/**
 * Actualizar un Producto App parcialmente (PATCH)
 */
export const patchProductoApp = async (accessToken, id, productoData) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-app/${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productoData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al actualizar el Producto App");
    }

    return response.json();
};

/**
 * Eliminar un Producto App
 */
export const deleteProductoApp = async (accessToken, id) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-app/${id}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al eliminar el Producto App");
    }

    return true;
};

/**
 * Carga masiva de Productos App desde Excel
 */
export const bulkCreateProductosAppFromExcel = async (accessToken, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/tada/ventas-productos-app/bulk-create-excel/`, {
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
 * Buscar Productos App principales por término de búsqueda
 */
export const searchProductosApp = async (accessToken, searchTerm) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);

    const response = await fetch(`${API_URL}/tada/ventas-productos-app/search/?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al buscar Productos App");
    }

    return response.json();
};

/**
 * Descargar plantilla de Excel para Productos App
 */
export const downloadProductosAppTemplate = async (accessToken) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-app/download-template/`, {
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
    a.download = "plantilla_productos_app.xlsx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
