"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    Button,
    Loader,
    Notification,
    Card,
    TextInput,
    NumberInput,
    Select,
    Switch,
    Accordion,
} from "@mantine/core";
import {
    RiArrowLeftLine,
    RiSaveLine,
    RiAddLine,
    RiCloseLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import {
    getProductoCompraById,
    createProductoCompra,
    patchProductoCompra,
    getCategoriesProductosCompra,
    getBrandsProductosCompra,
} from "@/tada/services/ventasProductosCompraApi";

const PERMISSION_PATH = "/dashboard/sales/productos-compra";

const ORIGEN_OPTIONS = [
    { value: "nacional", label: "Nacional" },
    { value: "importado", label: "Importado" },
];

export default function ProductosCompraFormPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useEffect(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user, router]);

    /* ------------------- ESTADO ------------------- */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    /* ------------------- FORMULARIO ------------------- */
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        homologated_names: [],
        mililiters_per_unit: 0,
        box_units: 0,
        primary_can: "",
        returnable: false,
        origen: "nacional",
        cost_per_unit: 0,
        cost_per_box: 0,
        cost_per_hectoliter: 0,
        hectoliter_per_unit: 0,
        hectoliter_box: 0,
        brand: "",
        category: "",
    });

    const [homologatedInput, setHomologatedInput] = useState("");
    const [homologatedNames, setHomologatedNames] = useState([]);

    /* ------------------- CATEGORÍAS ------------------- */
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    /* ------------------- MARCAS ------------------- */
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(false);

    /* =========================================================
       Cargar categorías
    ========================================================= */
    useEffect(() => {
        const loadCategories = async () => {
            if (!accessToken) return;

            setLoadingCategories(true);
            try {
                const data = await getCategoriesProductosCompra(accessToken);
                // Convertir el array de strings a formato para Select de Mantine
                const categoryOptions = data.categories.map((cat) => ({
                    value: cat,
                    label: cat,
                }));
                setCategories(categoryOptions);
            } catch (err) {
                console.error("Error al cargar categorías:", err);
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
    }, [accessToken]);

    /* =========================================================
       Cargar marcas
    ========================================================= */
    useEffect(() => {
        const loadBrands = async () => {
            if (!accessToken) return;

            setLoadingBrands(true);
            try {
                const data = await getBrandsProductosCompra(accessToken);
                // Convertir el array de strings a formato para Select de Mantine
                const brandOptions = data.brands.map((brand) => ({
                    value: brand,
                    label: brand,
                }));
                setBrands(brandOptions);
            } catch (err) {
                console.error("Error al cargar marcas:", err);
            } finally {
                setLoadingBrands(false);
            }
        };

        loadBrands();
    }, [accessToken]);

    /* =========================================================
       Cargar producto en modo edición
    ========================================================= */
    useEffect(() => {
        const loadProducto = async () => {
            if (!isEditMode || !accessToken) return;

            setLoading(true);
            try {
                const data = await getProductoCompraById(accessToken, editId);
                setFormData({
                    code: data.code || "",
                    name: data.name || "",
                    homologated_names: data.homologated_names || [],
                    mililiters_per_unit: data.mililiters_per_unit || 0,
                    box_units: data.box_units || 0,
                    primary_can: data.primary_can || "",
                    returnable: data.returnable || false,
                    origen: data.origen || "nacional",
                    cost_per_unit: data.cost_per_unit || 0,
                    cost_per_box: data.cost_per_box || 0,
                    cost_per_hectoliter: data.cost_per_hectoliter || 0,
                    hectoliter_per_unit: data.hectoliter_per_unit || 0,
                    hectoliter_box: data.hectoliter_box || 0,
                    brand: data.brand || "",
                    category: data.category || "",
                });
                setHomologatedNames(data.homologated_names || []);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Error al cargar el producto");
            } finally {
                setLoading(false);
            }
        };

        loadProducto();
    }, [editId, isEditMode, accessToken]);

    /* =========================================================
       Handlers
    ========================================================= */
    const handleAddHomologatedName = (e) => {
        if (e.key === "Enter" && homologatedInput.trim()) {
            e.preventDefault();
            if (!homologatedNames.includes(homologatedInput.trim())) {
                setHomologatedNames([...homologatedNames, homologatedInput.trim()]);
                setFormData({
                    ...formData,
                    homologated_names: [...homologatedNames, homologatedInput.trim()],
                });
            }
            setHomologatedInput("");
        }
    };

    const handleRemoveHomologatedName = (nameToRemove) => {
        const updated = homologatedNames.filter((name) => name !== nameToRemove);
        setHomologatedNames(updated);
        setFormData({ ...formData, homologated_names: updated });
    };

    const handleSave = async () => {
        // Validación
        if (!formData.code || !formData.name) {
            setError("El código y nombre son obligatorios");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const productoData = {
                code: formData.code,
                name: formData.name,
                homologated_names: formData.homologated_names,
                mililiters_per_unit: parseFloat(formData.mililiters_per_unit) || 0,
                box_units: parseInt(formData.box_units) || 0,
                primary_can: formData.primary_can,
                returnable: formData.returnable,
                origen: formData.origen,
                cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
                cost_per_box: parseFloat(formData.cost_per_box) || 0,
                cost_per_hectoliter: parseFloat(formData.cost_per_hectoliter) || 0,
                hectoliter_per_unit: parseFloat(formData.hectoliter_per_unit) || 0,
                hectoliter_box: parseFloat(formData.hectoliter_box) || 0,
                brand: formData.brand,
                category: formData.category,
            };

            if (isEditMode) {
                await patchProductoCompra(accessToken, editId, productoData);
            } else {
                await createProductoCompra(accessToken, productoData);
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/dashboard/sales/productos-compra");
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

    return (
        <div className="text-black">
            <div className="">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">
                        {isEditMode ? "Editar Producto Compra" : "Nuevo Producto Compra"}
                    </h1>
                    <Button
                        variant="outline"
                        leftSection={<RiArrowLeftLine />}
                        onClick={() => router.push("/dashboard/sales/productos-compra")}
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
                    <Notification color="green" className="mb-4">
                        Producto guardado exitosamente. Redirigiendo...
                    </Notification>
                )}

                {/* Formulario */}
                <Card shadow="sm" padding="lg">
                    <Accordion defaultValue="basico" variant="contained">
                        {/* Información Básica */}
                        <Accordion.Item value="basico">
                            <Accordion.Control>Información Básica</Accordion.Control>
                            <Accordion.Panel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextInput
                                        label="Código"
                                        placeholder="Ej: COMP001"
                                        value={formData.code}
                                        onChange={(e) =>
                                            setFormData({ ...formData, code: e.currentTarget.value })
                                        }
                                        required
                                    />
                                    <TextInput
                                        label="Nombre"
                                        placeholder="Ej: Cerveza Pilsen 355ml"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.currentTarget.value })
                                        }
                                        required
                                    />
                                    <Select
                                        label="Marca"
                                        placeholder="Selecciona una marca"
                                        data={brands}
                                        value={formData.brand}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                brand: value || "",
                                            })
                                        }
                                        searchable
                                        clearable
                                        disabled={loadingBrands}
                                    />
                                    <Select
                                        label="Categoría"
                                        placeholder="Selecciona una categoría"
                                        data={categories}
                                        value={formData.category}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                category: value || "",
                                            })
                                        }
                                        searchable
                                        clearable
                                        disabled={loadingCategories}
                                    />
                                    <Select
                                        data={ORIGEN_OPTIONS}
                                        label="Origen"
                                        value={formData.origen}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                origen: value || "nacional",
                                            })
                                        }
                                    />
                                    <TextInput
                                        label="Envase Principal"
                                        placeholder="Ej: Lata"
                                        value={formData.primary_can}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                primary_can: e.currentTarget.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="mt-4">
                                    <Switch
                                        label="Retornable"
                                        checked={formData.returnable}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                returnable: e.currentTarget.checked,
                                            })
                                        }
                                    />
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>

                        {/* Nombres Homologados */}
                        <Accordion.Item value="homologados">
                            <Accordion.Control>Nombres Homologados</Accordion.Control>
                            <Accordion.Panel>
                                <div className="space-y-3">
                                    <TextInput
                                        label="Agregar nombre homologado"
                                        placeholder="Escribe y presiona Enter"
                                        value={homologatedInput}
                                        onChange={(e) => setHomologatedInput(e.currentTarget.value)}
                                        onKeyDown={handleAddHomologatedName}
                                        rightSection={
                                            <RiAddLine className="text-gray-400" size={20} />
                                        }
                                    />
                                    {homologatedNames.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Nombres Homologados ({homologatedNames.length})
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {homologatedNames.map((name, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                                    >
                                                        <span>{name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveHomologatedName(name)
                                                            }
                                                            className="hover:text-blue-900"
                                                        >
                                                            <RiCloseLine size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>

                        {/* Medidas */}
                        <Accordion.Item value="medidas">
                            <Accordion.Control>Medidas y Presentación</Accordion.Control>
                            <Accordion.Panel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <NumberInput
                                        label="Mililitros por Unidad"
                                        placeholder="355"
                                        value={formData.mililiters_per_unit}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                mililiters_per_unit: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={1}
                                    />
                                    <NumberInput
                                        label="Unidades por Caja"
                                        placeholder="24"
                                        value={formData.box_units}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                box_units: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={1}
                                    />
                                    <NumberInput
                                        label="Hectolitros por Unidad"
                                        placeholder="0.00355"
                                        value={formData.hectoliter_per_unit}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                hectoliter_per_unit: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={0.00001}
                                        precision={5}
                                    />
                                    <NumberInput
                                        label="Hectolitros por Caja"
                                        placeholder="0.0852"
                                        value={formData.hectoliter_box}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                hectoliter_box: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={0.0001}
                                        precision={4}
                                    />
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>

                        {/* Costos */}
                        <Accordion.Item value="costos">
                            <Accordion.Control>Costos</Accordion.Control>
                            <Accordion.Panel>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <NumberInput
                                        label="Costo por Unidad"
                                        placeholder="2.50"
                                        value={formData.cost_per_unit}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                cost_per_unit: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={0.01}
                                        precision={2}
                                        prefix="S/ "
                                    />
                                    <NumberInput
                                        label="Costo por Caja"
                                        placeholder="60.00"
                                        value={formData.cost_per_box}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                cost_per_box: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={0.01}
                                        precision={2}
                                        prefix="S/ "
                                    />
                                    <NumberInput
                                        label="Costo por Hectolitro"
                                        placeholder="150.00"
                                        value={formData.cost_per_hectoliter}
                                        onChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                cost_per_hectoliter: value || 0,
                                            })
                                        }
                                        min={0}
                                        step={0.01}
                                        precision={2}
                                        prefix="S/ "
                                    />
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>

                    {/* Botones de acción */}
                    <div className="flex gap-2 mt-6">
                        <Button
                            fullWidth
                            leftSection={<RiSaveLine />}
                            onClick={handleSave}
                            loading={loading}
                            disabled={!formData.code || !formData.name}
                        >
                            {isEditMode ? "Actualizar Producto" : "Crear Producto"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/dashboard/sales/productos-compra")}
                        >
                            Cancelar
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
