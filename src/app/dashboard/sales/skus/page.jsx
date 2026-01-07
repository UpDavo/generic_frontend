"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    TextInput,
    Button,
    Loader,
    Notification,
    Pagination,
    Modal,
    Select,
    Switch,
    FileInput,
    NumberInput,
    Accordion,
} from "@mantine/core";
import {
    RiSearchLine,
    RiRefreshLine,
    RiCloseCircleLine,
    RiEditLine,
    RiEyeLine,
    RiAddLine,
    RiDeleteBinLine,
    RiUploadCloudLine,
    RiDownloadCloudLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import ConfirmDeleteModal from "@/core/components/ConfirmDeleteModal";
import {
    listSkus,
    getSkuById,
    createSku,
    patchSku,
    deleteSku,
    bulkCreateSkusFromExcel,
    downloadSkusTemplate,
    searchSkus,
} from "@/tada/services/skusCrudApi";

const PERMISSION_PATH = "/dashboard/sales/skus";

const TYPE_OPTIONS = [
    { value: "principal", label: "Principal" },
    { value: "combo", label: "Combo" },
];

const getTypeLabel = (type) => {
    const labels = {
        principal: "Principal",
        combo: "Combo",
    };
    return labels[type] || type;
};

const getTypeColor = (type) => {
    const colors = {
        principal: "#3B82F6",
        combo: "#F59E0B",
    };
    return colors[type] || "#6B7280";
};

export default function SkusPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useEffect(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user, router]);

    /* ------------------- FILTROS ------------------- */
    const [search, setSearch] = useState("");
    const [type, setType] = useState(null);
    const [vendorCode, setVendorCode] = useState("");
    const [skuVtex, setSkuVtex] = useState("");
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        type: null,
        vendorCode: "",
        skuVtex: "",
    });

    /* ------------------- TABLA ------------------- */
    const [skus, setSkus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /* ------------------- LISTA DE SKUs PARA COMBOS ------------------- */
    const [allSkus, setAllSkus] = useState([]);

    /* ------------------- MODAL DE EDICIÓN/CREACIÓN ------------------- */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSku, setEditingSku] = useState(null);
    const [formData, setFormData] = useState({
        type: "principal",
        vendor_code: "",
        sku_vtex: "",
        name: "",
        units: 1,
        milliliters_per_unit: 0,
        units_per_box: 0,
        homologated_names: [],
        active: true,
        child_skus_ids: [],
    });
    const [homologatedInput, setHomologatedInput] = useState("");
    const [homologatedNames, setHomologatedNames] = useState([]);

    /* ------------------- BÚSQUEDA DE SKUs PARA COMBOS ------------------- */
    const [skuSearchTerm, setSkuSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingSkus, setSearchingSkus] = useState(false);
    const [selectedChildSkus, setSelectedChildSkus] = useState([]);

    /* ------------------- MODAL DE PREVIEW ------------------- */
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewingSku, setPreviewingSku] = useState(null);

    /* ------------------- MODAL DE ELIMINACIÓN ------------------- */
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingSku, setDeletingSku] = useState(null);

    /* ------------------- MODAL DE EXCEL ------------------- */
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [uploadingExcel, setUploadingExcel] = useState(false);

    /* =========================================================
       Traer SKUs
    ========================================================= */
    const fetchSkus = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await listSkus(
                accessToken,
                page,
                appliedFilters.type,
                appliedFilters.active,
                appliedFilters.vendorCode,
                appliedFilters.skuVtex,
                appliedFilters.search,
                10
            );
            const results = data.results || [];
            setSkus(results);

            const itemsPerPage = 10;
            const count = data.count || 0;
            setTotalRecords(count);
            setTotalPages(Math.ceil(count / itemsPerPage));

            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los SKUs");
        } finally {
            setLoading(false);
        }
    }, [accessToken, page, appliedFilters]);

    useEffect(() => {
        fetchSkus();
    }, [fetchSkus]);

    /* =========================================================
       Cargar todos los SKUs principales para combos
    ========================================================= */
    useEffect(() => {
        const fetchAllSkus = async () => {
            if (!accessToken) return;
            try {
                const data = await listSkus(accessToken, 1, "principal", true, null, null, null, 1000);
                const results = data.results || [];
                setAllSkus(
                    results.map((sku) => ({
                        value: String(sku.id),
                        label: `${sku.name} (${sku.sku_vtex})`,
                    }))
                );
            } catch (err) {
                console.error(err);
            }
        };

        if (authorized && accessToken) {
            fetchAllSkus();
        }
    }, [authorized, accessToken]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({
                search: search,
                type: type,
                vendorCode: vendorCode,
                skuVtex: skuVtex,
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setSearch("");
            setType(null);
            setVendorCode("");
            setSkuVtex("");
            setAppliedFilters({
                search: "",
                type: null,
                vendorCode: "",
                skuVtex: "",
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };

    const openPreviewModal = (sku) => {
        setPreviewingSku(sku);
        setPreviewModalOpen(true);
    };

    const openEditModal = (sku) => {
        setEditingSku(sku);
        setFormData({
            type: sku.type || "principal",
            vendor_code: sku.vendor_code || "",
            sku_vtex: sku.sku_vtex || "",
            name: sku.name || "",
            units: sku.units || 1,
            milliliters_per_unit: sku.milliliters_per_unit || 0,
            units_per_box: sku.units_per_box || 0,
            homologated_names: sku.homologated_names || [],
            active: sku.active ?? true,
            child_skus_ids:
                sku.child_skus?.map((child) => String(child.id)) || [],
        });
        setHomologatedNames(sku.homologated_names || []);
        setHomologatedInput("");
        setSelectedChildSkus(sku.child_skus || []);
        setSkuSearchTerm("");
        setSearchResults([]);
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingSku(null);
        setFormData({
            type: "principal",
            vendor_code: "",
            sku_vtex: "",
            name: "",
            units: 1,
            milliliters_per_unit: 0,
            units_per_box: 0,
            homologated_names: [],
            active: true,
            child_skus_ids: [],
        });
        setHomologatedNames([]);
        setHomologatedInput("");
        setSelectedChildSkus([]);
        setSkuSearchTerm("");
        setSearchResults([]);
        setModalOpen(true);
    };

    const handleSaveSku = async () => {
        setLoading(true);
        try {
            const skuData = {
                ...formData,
                homologated_names: homologatedNames,
                child_skus_ids:
                    formData.type === "combo"
                        ? selectedChildSkus.map((sku) => sku.id)
                        : [],
            };

            if (editingSku) {
                await patchSku(accessToken, editingSku.id, skuData);
            } else {
                await createSku(accessToken, skuData);
            }

            setModalOpen(false);
            fetchSkus();
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al guardar el SKU");
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (sku) => {
        setDeletingSku(sku);
        setDeleteModalOpen(true);
    };

    const handleAddHomologatedName = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const trimmedValue = homologatedInput.trim();
            if (trimmedValue && !homologatedNames.includes(trimmedValue)) {
                setHomologatedNames([...homologatedNames, trimmedValue]);
                setHomologatedInput("");
            }
        }
    };

    const handleRemoveHomologatedName = (nameToRemove) => {
        setHomologatedNames(homologatedNames.filter((name) => name !== nameToRemove));
    };

    const handleSearchSkus = async () => {
        if (!skuSearchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchingSkus(true);
        try {
            const results = await searchSkus(accessToken, skuSearchTerm);
            // Filtrar los SKUs que ya están seleccionados y solo mostrar principales
            const filteredResults = results.filter(
                (result) =>
                    result.type === "principal" &&
                    !selectedChildSkus.some((selected) => selected.id === result.id)
            );
            setSearchResults(filteredResults);
        } catch (err) {
            console.error(err);
            setError("Error al buscar SKUs");
        } finally {
            setSearchingSkus(false);
        }
    };

    const handleAddChildSku = (sku) => {
        if (!selectedChildSkus.some((selected) => selected.id === sku.id)) {
            setSelectedChildSkus([...selectedChildSkus, sku]);
            // Remover de los resultados de búsqueda
            setSearchResults(searchResults.filter((result) => result.id !== sku.id));
        }
    };

    const handleRemoveChildSku = (skuId) => {
        setSelectedChildSkus(selectedChildSkus.filter((sku) => sku.id !== skuId));
    };

    const handleDeleteSku = async () => {
        if (!deletingSku) return;

        setLoading(true);
        try {
            await deleteSku(accessToken, deletingSku.id);
            setDeleteModalOpen(false);
            setDeletingSku(null);
            fetchSkus();
        } catch (err) {
            console.error(err);
            setError("Error al eliminar el SKU");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadExcel = async () => {
        if (!excelFile) return;

        setUploadingExcel(true);
        try {
            const result = await bulkCreateSkusFromExcel(accessToken, excelFile);
            setExcelModalOpen(false);
            setExcelFile(null);
            fetchSkus();
            alert(`Carga completada. ${JSON.stringify(result)}`);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al cargar el archivo");
        } finally {
            setUploadingExcel(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadSkusTemplate(accessToken);
        } catch (err) {
            console.error(err);
            setError("Error al descargar la plantilla");
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
        <div className=" text-black h-full flex flex-col">
            {error && (
                <Notification color="red" className="mb-4" onClose={() => setError(null)}>
                    {error}
                </Notification>
            )}

            {/* ---------------- FILTROS ---------------- */}
            <div className="mb-4 flex-shrink-0">
                {/* Botones de acción principales siempre visibles */}
                <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                        onClick={openCreateModal}
                        variant="filled"
                        color="green"
                        leftSection={<RiAddLine />}
                        className="flex-1 md:flex-none"
                    >
                        Nuevo SKU
                    </Button>
                    <Button
                        onClick={() => setExcelModalOpen(true)}
                        variant="filled"
                        color="blue"
                        leftSection={<RiUploadCloudLine />}
                        className="flex-1 md:flex-none"
                    >
                        Cargar Excel
                    </Button>
                </div>

                {/* Accordion para filtros en mobile, grid normal en desktop */}
                <div className="md:hidden">
                    <Accordion variant="contained">
                        <Accordion.Item value="filters">
                            <Accordion.Control>
                                <span className="font-bold">Filtros de Búsqueda</span>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <div className="grid grid-cols-1 gap-2">
                                    <TextInput
                                        label="Buscar"
                                        placeholder="Buscar por nombre"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        leftSection={<RiSearchLine />}
                                    />
                                    <TextInput
                                        label="Código Vendedor"
                                        placeholder="Ej: ABC123"
                                        value={vendorCode}
                                        onChange={(e) => setVendorCode(e.target.value)}
                                    />
                                    <TextInput
                                        label="SKU VTEX"
                                        placeholder="Ej: SKU001"
                                        value={skuVtex}
                                        onChange={(e) => setSkuVtex(e.target.value)}
                                    />
                                    <Select
                                        data={TYPE_OPTIONS}
                                        label="Tipo"
                                        placeholder="Selecciona tipo"
                                        value={type}
                                        onChange={setType}
                                        clearable
                                    />
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Button
                                            onClick={applyFilters}
                                            variant="filled"
                                            leftSection={<RiSearchLine />}
                                            disabled={loading || filtering}
                                        >
                                            {filtering ? <Loader size="xs" color="white" /> : "Buscar"}
                                        </Button>
                                        <Button
                                            onClick={clearFilters}
                                            variant="outline"
                                            leftSection={<RiCloseCircleLine />}
                                            disabled={loading || filtering}
                                        >
                                            Limpiar
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setPage(1);
                                            fetchSkus();
                                        }}
                                        variant="outline"
                                        leftSection={<RiRefreshLine />}
                                        disabled={loading || filtering}
                                        fullWidth
                                    >
                                        Refrescar
                                    </Button>
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </div>

                {/* Filtros normales en desktop */}
                <div className="hidden md:grid md:grid-cols-5 grid-cols-1 gap-2 items-end">
                    <TextInput
                        label="Buscar"
                        placeholder="Buscar por nombre"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftSection={<RiSearchLine />}
                    />
                    <TextInput
                        label="Código Vendedor"
                        placeholder="Ej: ABC123"
                        value={vendorCode}
                        onChange={(e) => setVendorCode(e.target.value)}
                    />
                    <TextInput
                        label="SKU VTEX"
                        placeholder="Ej: SKU001"
                        value={skuVtex}
                        onChange={(e) => setSkuVtex(e.target.value)}
                    />
                    <Select
                        data={TYPE_OPTIONS}
                        label="Tipo"
                        placeholder="Selecciona tipo"
                        value={type}
                        onChange={setType}
                        clearable
                    />
                    <Button
                        onClick={applyFilters}
                        variant="filled"
                        leftSection={<RiSearchLine />}
                        disabled={loading || filtering}
                    >
                        {filtering ? <Loader size="xs" color="white" /> : "Buscar"}
                    </Button>
                    <Button
                        onClick={clearFilters}
                        variant="outline"
                        leftSection={<RiCloseCircleLine />}
                        disabled={loading || filtering}
                    >
                        Limpiar
                    </Button>
                    <Button
                        onClick={() => {
                            setPage(1);
                            fetchSkus();
                        }}
                        variant="outline"
                        leftSection={<RiRefreshLine />}
                        disabled={loading || filtering}
                    >
                        Refrescar
                    </Button>
                </div>
            </div>

            {/* ---------------- MÉTRICAS ---------------- */}
            {totalRecords > 0 && (
                <div className="mb-4 flex-shrink-0">
                    <div className="card bg-white shadow-md p-6 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-500 uppercase mb-2">
                            Total de SKUs
                        </div>
                        <div className="text-4xl font-bold text-black">{totalRecords}</div>
                    </div>
                </div>
            )}

            {/* ---------------- TABLA ---------------- */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="hidden md:block flex-1 overflow-auto rounded-md">
                    <table className="table w-full">
                        <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th>Tipo</th>
                                <th>Código Vendedor</th>
                                <th>SKU VTEX</th>
                                <th>Nombre</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-black">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4">
                                        <Loader size="sm" color="blue" />
                                    </td>
                                </tr>
                            ) : skus.length ? (
                                skus.map((sku) => (
                                    <tr key={sku.id} className="hover:bg-gray-100">
                                        <td>
                                            <span
                                                className="badge badge-sm"
                                                style={{
                                                    backgroundColor: getTypeColor(sku.type),
                                                    color: "white",
                                                }}
                                            >
                                                {getTypeLabel(sku.type)}
                                            </span>
                                        </td>
                                        <td className="font-bold">{sku.vendor_code}</td>
                                        <td>{sku.sku_vtex}</td>
                                        <td>{sku.name}</td>
                                        <td>
                                            <Button.Group>
                                                <Button
                                                    size="xs"
                                                    onClick={() => openEditModal(sku)}
                                                    leftSection={<RiEditLine />}
                                                    title="Editar SKU"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    onClick={() => openPreviewModal(sku)}
                                                    leftSection={<RiEyeLine />}
                                                    title="Ver detalles"
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => openDeleteModal(sku)}
                                                    leftSection={<RiDeleteBinLine />}
                                                    title="Eliminar SKU"
                                                >
                                                    Eliminar
                                                </Button>
                                            </Button.Group>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-4">
                                        No se encontraron SKUs.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Vista móvil */}
                <div className="md:hidden block flex-1 overflow-auto space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center py-4">
                            <Loader size="sm" color="blue" />
                        </div>
                    ) : skus.length ? (
                        skus.map((sku) => (
                            <div
                                key={sku.id}
                                className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                            >
                                <div className="mb-1 font-semibold">Tipo:</div>
                                <div className="flex gap-2 mb-2">
                                    <span
                                        className="badge badge-sm"
                                        style={{
                                            backgroundColor: getTypeColor(sku.type),
                                            color: "white",
                                        }}
                                    >
                                        {getTypeLabel(sku.type)}
                                    </span>
                                </div>

                                <div className="mb-1 font-semibold">Nombre:</div>
                                <div className="mb-2">{sku.name}</div>

                                <div className="mb-1 font-semibold">SKU VTEX:</div>
                                <div className="mb-2">{sku.sku_vtex}</div>

                                <div className="mb-1 font-semibold">Código Vendedor:</div>
                                <div className="mb-2">{sku.vendor_code}</div>

                                <div className="text-xs text-gray-500 mt-2">
                                    {new Date(sku.created_at).toLocaleString()}
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="xs"
                                        onClick={() => openEditModal(sku)}
                                        leftSection={<RiEditLine />}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={() => openPreviewModal(sku)}
                                        leftSection={<RiEyeLine />}
                                        className="flex-1"
                                    >
                                        Ver
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="red"
                                        onClick={() => openDeleteModal(sku)}
                                        leftSection={<RiDeleteBinLine />}
                                        className="flex-1"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">No se encontraron SKUs.</div>
                    )}
                </div>

                <Pagination
                    value={page}
                    onChange={setPage}
                    total={totalPages}
                    siblings={1}
                    boundaries={1}
                    className="mt-6 flex-shrink-0"
                />
            </div>

            {/* ---------------- MODAL DE EDICIÓN/CREACIÓN ---------------- */}
            <Modal
                opened={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingSku(null);
                }}
                title={editingSku ? "Editar SKU" : "Crear SKU"}
                centered
                size="lg"
                className="text-black"
            >
                <div className="text-black max-h-[70vh] overflow-y-auto">
                    <Accordion defaultValue="basico" variant="contained">
                        <Accordion.Item value="basico">
                            <Accordion.Control>Información Básica</Accordion.Control>
                            <Accordion.Panel>
                                <div className="space-y-4">
                                    <Select
                                        data={TYPE_OPTIONS}
                                        label="Tipo"
                                        placeholder="Selecciona tipo"
                                        value={formData.type}
                                        onChange={(value) => setFormData({ ...formData, type: value || "principal" })}
                                        required
                                    />

                                    <TextInput
                                        label="Código Vendedor"
                                        placeholder="Ej: ABC123"
                                        value={formData.vendor_code}
                                        onChange={(e) =>
                                            setFormData({ ...formData, vendor_code: e.currentTarget.value })
                                        }
                                        required
                                    />

                                    <TextInput
                                        label="SKU VTEX"
                                        placeholder="Ej: SKU001"
                                        value={formData.sku_vtex}
                                        onChange={(e) =>
                                            setFormData({ ...formData, sku_vtex: e.currentTarget.value })
                                        }
                                        required
                                    />

                                    <TextInput
                                        label="Nombre"
                                        placeholder="Ej: Cerveza Pilsener 355ml"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.currentTarget.value })
                                        }
                                        required
                                    />
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="medidas">
                            <Accordion.Control>Medidas y Unidades</Accordion.Control>
                            <Accordion.Panel>
                                <div className="space-y-4">
                                    <NumberInput
                                        label="Unidades"
                                        placeholder="1"
                                        value={formData.units}
                                        onChange={(value) => setFormData({ ...formData, units: value || 1 })}
                                        min={1}
                                        required
                                    />

                                    <NumberInput
                                        label="Mililitros por Unidad"
                                        placeholder="355.0"
                                        value={formData.milliliters_per_unit}
                                        onChange={(value) =>
                                            setFormData({ ...formData, milliliters_per_unit: value || 0 })
                                        }
                                        min={0}
                                        step={0.1}
                                        precision={2}
                                        required
                                    />

                                    <NumberInput
                                        label="Unidades por Caja"
                                        placeholder="24"
                                        value={formData.units_per_box}
                                        onChange={(value) =>
                                            setFormData({ ...formData, units_per_box: value || 0 })
                                        }
                                        min={0}
                                    />
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="homologados">
                            <Accordion.Control>Nombres Homologados</Accordion.Control>
                            <Accordion.Panel>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">
                                            Nombres Homologados
                                        </label>
                                        <TextInput
                                            placeholder="Escribe un nombre y presiona Enter"
                                            value={homologatedInput}
                                            onChange={(e) => setHomologatedInput(e.currentTarget.value)}
                                            onKeyDown={handleAddHomologatedName}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {homologatedNames.map((name, idx) => (
                                                <span
                                                    key={idx}
                                                    className="badge badge-primary badge-md gap-2"
                                                >
                                                    {name}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveHomologatedName(name)}
                                                        className="btn btn-ghost btn-xs btn-circle"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>

                        {formData.type === "combo" && (
                            <Accordion.Item value="skus-hijos">
                                <Accordion.Control>SKUs Hijos</Accordion.Control>
                                <Accordion.Panel>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">
                                                Buscar SKUs Hijos (solo principales)
                                            </label>
                                            <div className="flex gap-2">
                                                <TextInput
                                                    placeholder="Buscar por nombre o SKU VTEX"
                                                    value={skuSearchTerm}
                                                    onChange={(e) => setSkuSearchTerm(e.currentTarget.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleSearchSkus();
                                                        }
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    onClick={handleSearchSkus}
                                                    loading={searchingSkus}
                                                    leftSection={<RiSearchLine />}
                                                >
                                                    Buscar
                                                </Button>
                                            </div>

                                            {/* Resultados de búsqueda */}
                                            {searchResults.length > 0 && (
                                                <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                                                    {searchResults.map((sku) => (
                                                        <div
                                                            key={sku.id}
                                                            className="p-2 hover:bg-gray-50 border-b border-gray-100 flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <div className="font-semibold text-sm">{sku.name}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {sku.sku_vtex} - {sku.vendor_code}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="xs"
                                                                onClick={() => handleAddChildSku(sku)}
                                                                leftSection={<RiAddLine />}
                                                            >
                                                                Agregar
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* SKUs seleccionados */}
                                            {selectedChildSkus.length > 0 && (
                                                <div className="mt-3">
                                                    <label className="text-sm font-medium mb-1 block">
                                                        SKUs Seleccionados ({selectedChildSkus.length})
                                                    </label>
                                                    <div className="space-y-2">
                                                        {selectedChildSkus.map((sku) => (
                                                            <div
                                                                key={sku.id}
                                                                className="flex justify-between items-center p-2 bg-blue-50 rounded-md"
                                                            >
                                                                <div>
                                                                    <div className="font-semibold text-sm">{sku.name}</div>
                                                                    <div className="text-xs text-gray-600">
                                                                        {sku.sku_vtex} - {sku.vendor_code}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveChildSku(sku.id)}
                                                                    className="btn btn-ghost btn-xs btn-circle"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Accordion.Panel>
                            </Accordion.Item>
                        )}
                    </Accordion>

                    <Button fullWidth onClick={handleSaveSku} loading={loading} className="mt-4">
                        {editingSku ? "Actualizar SKU" : "Crear SKU"}
                    </Button>
                </div>
            </Modal>

            {/* ---------------- MODAL DE PREVIEW ---------------- */}
            <Modal
                opened={previewModalOpen}
                onClose={() => {
                    setPreviewModalOpen(false);
                    setPreviewingSku(null);
                }}
                title="Detalles del SKU"
                centered
                size="lg"
                className="text-black"
            >
                {previewingSku && (
                    <div className="space-y-3 text-black max-h-[70vh] overflow-y-auto">
                        <div>
                            <strong>Tipo:</strong>{" "}
                            <span
                                className="badge badge-sm"
                                style={{
                                    backgroundColor: getTypeColor(previewingSku.type),
                                    color: "white",
                                }}
                            >
                                {getTypeLabel(previewingSku.type)}
                            </span>
                        </div>
                        <div>
                            <strong>Código Vendedor:</strong> {previewingSku.vendor_code}
                        </div>
                        <div>
                            <strong>SKU VTEX:</strong> {previewingSku.sku_vtex}
                        </div>
                        <div>
                            <strong>Nombre:</strong> {previewingSku.name}
                        </div>
                        <div>
                            <strong>Unidades:</strong> {previewingSku.units}
                        </div>
                        <div>
                            <strong>Mililitros por Unidad:</strong>{" "}
                            {previewingSku.milliliters_per_unit?.toFixed(2) || "-"}
                        </div>
                        <div>
                            <strong>Unidades por Caja:</strong>{" "}
                            {previewingSku.units_per_box || "-"}
                        </div>
                        <div>
                            <strong>Hectolitros por Unidad:</strong>{" "}
                            {previewingSku.hectoliters_per_unit?.toFixed(5) || "-"}
                        </div>
                        <div>
                            <strong>Hectolitros por Caja:</strong>{" "}
                            {previewingSku.hectoliters_per_box?.toFixed(5) || "-"}
                        </div>
                        <div>
                            <strong>Nombres Homologados:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(previewingSku.homologated_names || []).length > 0 ? (
                                    previewingSku.homologated_names.map((name, idx) => (
                                        <span key={idx} className="badge badge-ghost badge-sm">
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">
                                        Sin nombres homologados
                                    </span>
                                )}
                            </div>
                        </div>
                        {previewingSku.type === "combo" &&
                            (previewingSku.child_skus || []).length > 0 && (
                                <div>
                                    <strong className="block mb-2">SKUs Asociados:</strong>
                                    <div className="overflow-x-auto">
                                        <table className="table table-sm w-full border border-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border border-gray-200">SKU VTEX</th>
                                                    <th className="border border-gray-200">Nombre</th>
                                                    <th className="border border-gray-200">Unidades</th>
                                                    <th className="border border-gray-200">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewingSku.child_skus.map((child) => (
                                                    <tr key={child.id} className="hover:bg-gray-50">
                                                        <td className="border border-gray-200 font-mono text-xs">
                                                            {child.sku_vtex}
                                                        </td>
                                                        <td className="border border-gray-200">
                                                            {child.name}
                                                        </td>
                                                        <td className="border border-gray-200 text-center">
                                                            {child.units}
                                                        </td>
                                                        <td className="border border-gray-200 text-center">
                                                            {child.active ? (
                                                                <span className="badge badge-success badge-xs">
                                                                    Activo
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-error badge-xs">
                                                                    Inactivo
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </Modal>

            {/* ---------------- MODAL DE ELIMINACIÓN ---------------- */}
            <ConfirmDeleteModal
                opened={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeletingSku(null);
                }}
                onConfirm={handleDeleteSku}
                title="Eliminar SKU"
                message={`¿Estás seguro de que deseas eliminar el SKU "${deletingSku?.name}"?`}
                loading={loading}
            />

            {/* ---------------- MODAL DE EXCEL ---------------- */}
            <Modal
                opened={excelModalOpen}
                onClose={() => {
                    setExcelModalOpen(false);
                    setExcelFile(null);
                }}
                title="Cargar SKUs desde Excel"
                centered
                className="text-black"
            >
                <div className="space-y-4 text-black">
                    <FileInput
                        label="Archivo Excel"
                        placeholder="Selecciona un archivo"
                        accept=".xlsx,.xls"
                        value={excelFile}
                        onChange={setExcelFile}
                    />

                    <Button
                        fullWidth
                        onClick={handleUploadExcel}
                        loading={uploadingExcel}
                        disabled={!excelFile}
                        leftSection={<RiUploadCloudLine />}
                    >
                        Cargar Archivo
                    </Button>

                    <Button
                        fullWidth
                        variant="outline"
                        onClick={handleDownloadTemplate}
                        leftSection={<RiDownloadCloudLine />}
                    >
                        Descargar Plantilla
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
