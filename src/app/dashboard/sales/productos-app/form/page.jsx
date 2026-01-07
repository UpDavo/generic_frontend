"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    TextInput,
    Button,
    Loader,
    Notification,
    Select,
    NumberInput,
    Card,
} from "@mantine/core";
import {
    RiSearchLine,
    RiSaveLine,
    RiArrowLeftLine,
    RiAddLine,
    RiDeleteBinLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import {
    getProductoAppById,
    createProductoApp,
    patchProductoApp,
} from "@/tada/services/ventasProductosAppApi";
import { searchProductosCompra } from "@/tada/services/ventasProductosCompraApi";

const PERMISSION_PATH = "/dashboard/sales/productos-app";

const TYPE_OPTIONS = [
    { value: "principal", label: "Principal" },
    { value: "combo", label: "Combo" },
];

export default function ProductosAppFormPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id"); // Para editar: ?id=123

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useEffect(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user, router]);

    /* ------------------- ESTADO DEL FORMULARIO ------------------- */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        type: "principal",
        code: "",
        name: "",
        unit: 1,
    });
    const [selectedMaterials, setSelectedMaterials] = useState([]);

    /* ------------------- BÚSQUEDA DE PRODUCTOS COMPRA ------------------- */
    const [materialSearchTerm, setMaterialSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingMaterials, setSearchingMaterials] = useState(false);

    /* =========================================================
       Cargar producto si es edición
    ========================================================= */
    useEffect(() => {
        const loadProducto = async () => {
            if (!editId || !accessToken) return;

            setLoading(true);
            try {
                const producto = await getProductoAppById(accessToken, editId);
                setFormData({
                    type: producto.type || "principal",
                    code: producto.code || "",
                    name: producto.name || "",
                    unit: producto.unit || 1,
                });

                // Convertir material_items a selectedMaterials
                const materials = (producto.material_items || []).map((mat) => ({
                    id: mat.ventas_productos_compra?.id,
                    code: mat.ventas_productos_compra?.code,
                    name: mat.ventas_productos_compra?.name,
                    brand: mat.ventas_productos_compra?.brand,
                    quantity: parseFloat(mat.quantity) || 0,
                }));
                setSelectedMaterials(materials);
            } catch (err) {
                console.error(err);
                setError("Error al cargar el producto");
            } finally {
                setLoading(false);
            }
        };

        loadProducto();
    }, [editId, accessToken]);

    /* =========================================================
       Calcular automáticamente el unit sumando las cantidades de materiales
    ========================================================= */
    useEffect(() => {
        const totalUnits = selectedMaterials.reduce((sum, mat) => {
            return sum + (parseFloat(mat.quantity) || 0);
        }, 0);
        
        setFormData(prev => ({
            ...prev,
            unit: totalUnits || 1 // Si no hay materiales, mínimo 1
        }));
    }, [selectedMaterials]);

    /* =========================================================
       Búsqueda de Materiales
    ========================================================= */
    const handleSearchMaterials = async () => {
        if (!materialSearchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchingMaterials(true);
        try {
            const results = await searchProductosCompra(accessToken, materialSearchTerm);
            // Filtrar los que ya están seleccionados
            const filteredResults = results.filter(
                (result) => !selectedMaterials.some((selected) => selected.id === result.id)
            );
            setSearchResults(filteredResults);
        } catch (err) {
            console.error(err);
            setError("Error al buscar productos compra");
        } finally {
            setSearchingMaterials(false);
        }
    };

    const handleAddMaterial = (material) => {
        const newMaterial = {
            id: material.id,
            code: material.code,
            name: material.name,
            brand: material.brand,
            quantity: 1,
        };
        setSelectedMaterials([...selectedMaterials, newMaterial]);
        // Remover de los resultados de búsqueda
        setSearchResults(searchResults.filter((result) => result.id !== material.id));
        setMaterialSearchTerm("");
    };

    const handleRemoveMaterial = (materialId) => {
        setSelectedMaterials(selectedMaterials.filter((mat) => mat.id !== materialId));
    };

    const handleUpdateMaterialQuantity = (materialId, quantity) => {
        setSelectedMaterials(
            selectedMaterials.map((mat) =>
                mat.id === materialId ? { ...mat, quantity: parseFloat(quantity) || 0 } : mat
            )
        );
    };

    /* =========================================================
       Guardar Producto
    ========================================================= */
    const handleSave = async () => {
        // Validaciones
        if (!formData.code || !formData.name) {
            setError("Código y nombre son obligatorios");
            return;
        }

        if (selectedMaterials.length === 0) {
            setError("Todos los productos app deben tener al menos un producto de compra asociado");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const productoData = {
                ...formData,
                materials_data: selectedMaterials.map((mat) => ({
                    ventas_productos_compra_id: mat.id,
                    quantity: mat.quantity,
                })),
            };

            if (editId) {
                await patchProductoApp(accessToken, editId, productoData);
                setSuccess("Producto actualizado exitosamente");
            } else {
                await createProductoApp(accessToken, productoData);
                setSuccess("Producto creado exitosamente");
            }

            // Redireccionar después de 1.5 segundos
            setTimeout(() => {
                router.push("/dashboard/sales/productos-app");
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al guardar el producto");
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       Render
    ========================================================= */
    if (authorized === null) {
        return (
            <div className="flex justify-center items-center mt-64">
                <Loader size="lg" />
            </div>
        );
    }
    if (!authorized) return <Unauthorized />;

    if (loading && editId) {
        return (
            <div className="flex justify-center items-center mt-64">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="text-black">
            <div className="">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {editId ? "Editar Producto App" : "Nuevo Producto App"}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {editId ? "Modifica los datos del producto" : "Completa los datos para crear un nuevo producto"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        leftSection={<RiArrowLeftLine />}
                        onClick={() => router.push("/dashboard/sales/productos-app")}
                    >
                        Volver
                    </Button>
                </div>

                {/* Notificaciones */}
                {error && (
                    <Notification color="red" className="mb-4" onClose={() => setError(null)}>
                        {error}
                    </Notification>
                )}
                {success && (
                    <Notification color="green" className="mb-4" onClose={() => setSuccess(null)}>
                        {success}
                    </Notification>
                )}

                {/* Formulario Principal */}
                <Card shadow="sm" padding="lg" className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Información Básica</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Tipo"
                            placeholder="Selecciona tipo"
                            data={TYPE_OPTIONS}
                            value={formData.type}
                            onChange={(value) => setFormData({ ...formData, type: value || "principal" })}
                            required
                        />

                        <TextInput
                            label="Código"
                            placeholder="Ej: APP001"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
                            required
                        />

                        <TextInput
                            label="Nombre"
                            placeholder="Ej: Pack Cerveza Mixto"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                            className="md:col-span-2"
                            required
                        />

                        <NumberInput
                            label="Unidad (Calculado automáticamente)"
                            placeholder="Se calcula sumando las cantidades"
                            value={formData.unit}
                            readOnly
                            disabled
                            min={1}
                            description="La unidad se calcula automáticamente sumando las cantidades de los productos de compra"
                        />
                    </div>
                </Card>

                {/* Sección de Materiales (OBLIGATORIO para todos los productos) */}
                <Card shadow="sm" padding="lg" className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Materiales (Productos Compra) <span className="text-red-500">*</span>
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Todos los productos app deben tener al menos un producto de compra asociado
                    </p>

                        {/* Buscador */}
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block">
                                Buscar Productos Compra
                            </label>
                            <div className="flex gap-2">
                                <TextInput
                                    placeholder="Buscar por nombre, código o marca..."
                                    value={materialSearchTerm}
                                    onChange={(e) => setMaterialSearchTerm(e.currentTarget.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSearchMaterials();
                                        }
                                    }}
                                    className="flex-1"
                                    leftSection={<RiSearchLine />}
                                />
                                <Button
                                    onClick={handleSearchMaterials}
                                    loading={searchingMaterials}
                                    leftSection={<RiSearchLine />}
                                >
                                    Buscar
                                </Button>
                            </div>

                            {/* Resultados de búsqueda */}
                            {searchResults.length > 0 && (
                                <div className="mt-3 border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                                    {searchResults.map((material) => (
                                        <div
                                            key={material.id}
                                            className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                                        >
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">
                                                    {material.name}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                        {material.code}
                                                    </span>
                                                    {material.brand && (
                                                        <span className="ml-2">Marca: {material.brand}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="xs"
                                                onClick={() => handleAddMaterial(material)}
                                                leftSection={<RiAddLine />}
                                            >
                                                Agregar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchingMaterials && (
                                <div className="mt-3 text-center py-4">
                                    <Loader size="sm" />
                                </div>
                            )}
                        </div>

                        {/* Materiales seleccionados */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Materiales Seleccionados ({selectedMaterials.length})
                            </label>

                            {selectedMaterials.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                                    <p className="text-gray-500">
                                        No hay materiales seleccionados
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Busca y agrega productos compra para este combo
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedMaterials.map((material, index) => (
                                        <div
                                            key={material.id}
                                            className="flex items-center gap-3 p-3 bg-purple-50 rounded-md border border-purple-200"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">
                                                    {material.name}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-mono bg-white px-2 py-0.5 rounded">
                                                        {material.code}
                                                    </span>
                                                    {material.brand && (
                                                        <span className="ml-2">Marca: {material.brand}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <NumberInput
                                                placeholder="Cantidad"
                                                value={material.quantity}
                                                onChange={(value) =>
                                                    handleUpdateMaterialQuantity(material.id, value)
                                                }
                                                min={0.01}
                                                step={0.1}
                                                precision={2}
                                                className="w-32"
                                                size="sm"
                                            />
                                            <Button
                                                size="xs"
                                                color="red"
                                                variant="light"
                                                onClick={() => handleRemoveMaterial(material.id)}
                                                leftSection={<RiDeleteBinLine />}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                </Card>

                {/* Botones de acción */}
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/sales/productos-app")}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        loading={loading}
                        leftSection={<RiSaveLine />}
                        color="green"
                    >
                        {editId ? "Actualizar Producto" : "Crear Producto"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
