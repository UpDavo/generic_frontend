import API_BASE_URL from "@/config/apiConfig";

const API_URL = API_BASE_URL;

/**
 * Obtener categorías disponibles
 */
export const getCategoriesProductosCompra = async (accessToken) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/categories/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener las categorías");
    }

    return response.json();
};

/**
 * Listar Productos Compra con filtros y paginación
 */
export const listProductosCompra = async (
    accessToken,
    page = 1,
    code = null,
    name = null,
    brand = null,
    category = null,
    origen = null,
    returnable = null,
    search = null,
    pageSize = 10
) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (pageSize) params.append("page_size", pageSize);
    if (code) params.append("code", code);
    if (name) params.append("name", name);
    if (brand) params.append("brand", brand);
    if (category) params.append("category", category);
    if (origen) params.append("origen", origen);
    if (returnable !== null) params.append("returnable", returnable);
    if (search) params.append("search", search);

    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener los Productos Compra");
    }

    return response.json();
};

/**
 * Obtener un Producto Compra por ID
 */
export const getProductoCompraById = async (accessToken, id) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/${id}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener el Producto Compra");
    }

    return response.json();
};

/**
 * Crear un nuevo Producto Compra
 */
export const createProductoCompra = async (accessToken, productoData) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productoData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al crear el Producto Compra");
    }

    return response.json();
};

/**
 * Actualizar un Producto Compra (PUT - completo)
 */
export const updateProductoCompra = async (accessToken, id, productoData) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productoData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al actualizar el Producto Compra");
    }

    return response.json();
};

/**
 * Actualizar un Producto Compra parcialmente (PATCH)
 */
export const patchProductoCompra = async (accessToken, id, productoData) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productoData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al actualizar el Producto Compra");
    }

    return response.json();
};

/**
 * Eliminar un Producto Compra
 */
export const deleteProductoCompra = async (accessToken, id) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/${id}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al eliminar el Producto Compra");
    }

    return true;
};

/**
 * Carga masiva de Productos Compra desde Excel
 */
export const bulkCreateProductosCompraFromExcel = async (accessToken, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/bulk-create-excel/`, {
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
 * Buscar Productos Compra por término de búsqueda rápida
 */
export const searchProductosCompra = async (accessToken, searchTerm) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);

    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/search/?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al buscar Productos Compra");
    }

    return response.json();
};

/**
 * Descargar plantilla de Excel para Productos Compra
 */
export const downloadProductosCompraTemplate = async (accessToken) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/download-template/`, {
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
    a.download = "plantilla_productos_compra.xlsx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

/**
 * Descargar todos los Productos Compra en Excel
 */
export const downloadAllProductosCompra = async (accessToken) => {
    const response = await fetch(`${API_URL}/tada/ventas-productos-compra/download-all/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Error al descargar los productos");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productos_compra_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
