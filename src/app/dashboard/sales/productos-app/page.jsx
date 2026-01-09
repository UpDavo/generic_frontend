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
    FileInput,
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
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import {
    listProductosApp,
    deleteProductoApp,
    bulkCreateProductosAppFromExcel,
    downloadProductosAppTemplate,
    downloadAllProductosApp,
} from "@/tada/services/ventasProductosAppApi";

const PERMISSION_PATH = "/dashboard/sales/productos-app";

const TYPE_OPTIONS = [
    { value: "principal", label: "Principal" },
    { value: "combo", label: "Combo" },
];

export default function ProductosAppPage() {
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
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        type: null,
        code: "",
        name: "",
    });

    /* ------------------- TABLA ------------------- */
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /* ------------------- MODAL DE ELIMINACIÓN ------------------- */
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingProducto, setDeletingProducto] = useState(null);

    /* ------------------- MODAL DE EXCEL ------------------- */
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

    /* =========================================================
       Traer Productos
    ========================================================= */
    const fetchProductos = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await listProductosApp(
                accessToken,
                page,
                appliedFilters.type,
                appliedFilters.code,
                appliedFilters.name,
                appliedFilters.search,
                10
            );
            const results = data.results || [];
            setProductos(results);

            const itemsPerPage = 10;
            const count = data.count || 0;
            setTotalRecords(count);
            setTotalPages(Math.ceil(count / itemsPerPage));

            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los Productos App");
        } finally {
            setLoading(false);
        }
    }, [accessToken, page, appliedFilters]);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({
                search: search,
                type: type,
                code: code,
                name: name,
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
            setCode("");
            setName("");
            setAppliedFilters({
                search: "",
                type: null,
                code: "",
                name: "",
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };



    const openDeleteModal = (producto) => {
        setDeletingProducto(producto);
        setDeleteModalOpen(true);
    };

    const handleDeleteProducto = async () => {
        if (!deletingProducto) return;

        setLoading(true);
        try {
            await deleteProductoApp(accessToken, deletingProducto.id);
            setDeleteModalOpen(false);
            setDeletingProducto(null);
            fetchProductos();
        } catch (err) {
            console.error(err);
            setError("Error al eliminar el Producto App");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadExcel = async () => {
        if (!excelFile) return;

        setUploadingExcel(true);
        setExcelModalOpen(false);
        try {
            await bulkCreateProductosAppFromExcel(accessToken, excelFile);
            setShowSuccessOverlay(true);
            setExcelFile(null);
            await fetchProductos();
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al cargar el archivo");
            setUploadingExcel(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadProductosAppTemplate(accessToken);
        } catch (err) {
            console.error(err);
            setError("Error al descargar la plantilla");
        }
    };

    const handleDownloadAll = async () => {
        try {
            await downloadAllProductosApp(accessToken);
        } catch (err) {
            console.error(err);
            setError("Error al descargar los productos");
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
                        onClick={() => router.push("/dashboard/sales/productos-app/form")}
                        variant="filled"
                        color="green"
                        leftSection={<RiAddLine />}
                        className="flex-1 md:flex-none"
                    >
                        Nuevo Producto App
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
                    <Button
                        onClick={handleDownloadAll}
                        variant="filled"
                        color="teal"
                        leftSection={<RiDownloadCloudLine />}
                        className="flex-1 md:flex-none"
                    >
                        Descargar Todos
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
                                        placeholder="Buscar por nombre o código"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        leftSection={<RiSearchLine />}
                                    />
                                    <TextInput
                                        label="Código"
                                        placeholder="Ej: APP001"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
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
                                            fetchProductos();
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
                        placeholder="Buscar por nombre o código"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftSection={<RiSearchLine />}
                    />
                    <TextInput
                        label="Código"
                        placeholder="Ej: APP001"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
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
                </div>
            </div>

            {/* ---------------- MÉTRICAS ---------------- */}
            {totalRecords > 0 && (
                <div className="mb-4 flex-shrink-0">
                    <div className="card bg-white shadow-md p-6 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-500 uppercase mb-2">
                            Total de Productos App
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
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Unidad</th>
                                <th>Materiales</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-black">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4">
                                        <Loader size="sm" color="blue" />
                                    </td>
                                </tr>
                            ) : productos.length ? (
                                productos.map((producto) => (
                                    <tr key={producto.id} className="hover:bg-gray-100 uppercase">
                                        <td>
                                            <span
                                                className={`badge badge-sm ${producto.type === "principal"
                                                    ? "badge-info"
                                                    : "badge-warning"
                                                    }`}
                                            >
                                                {producto.type}
                                            </span>
                                        </td>
                                        <td className="font-bold">{producto.code}</td>
                                        <td>{producto.name}</td>
                                        <td>{producto.unit}</td>
                                        <td>
                                            <span className="badge badge-ghost badge-sm">
                                                {producto.materials_count || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <Button.Group>
                                                <Button
                                                    size="xs"
                                                    onClick={() => router.push(`/dashboard/sales/productos-app/form?id=${producto.id}`)}
                                                    leftSection={<RiEditLine />}
                                                    title="Editar Producto"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    onClick={() => router.push(`/dashboard/sales/productos-app/view/${producto.id}`)}
                                                    leftSection={<RiEyeLine />}
                                                    title="Ver detalles"
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => openDeleteModal(producto)}
                                                    leftSection={<RiDeleteBinLine />}
                                                    title="Eliminar Producto"
                                                >
                                                    Eliminar
                                                </Button>
                                            </Button.Group>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-4">
                                        No se encontraron Productos App.
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
                    ) : productos.length ? (
                        productos.map((producto) => (
                            <div
                                key={producto.id}
                                className="border border-gray-200 rounded-lg p-4 bg-white shadow-md uppercase"
                            >
                                <div className="mb-1 font-semibold">Tipo:</div>
                                <div className="flex gap-2 mb-2">
                                    <span
                                        className={`badge badge-sm ${producto.type === "principal"
                                            ? "badge-info"
                                            : "badge-warning"
                                            }`}
                                    >
                                        {producto.type}
                                    </span>
                                </div>

                                <div className="mb-1 font-semibold">Código:</div>
                                <div className="mb-2 font-bold">{producto.code}</div>

                                <div className="mb-1 font-semibold">Nombre:</div>
                                <div className="mb-2">{producto.name}</div>

                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="xs"
                                        onClick={() => router.push(`/dashboard/sales/productos-app/form?id=${producto.id}`)}
                                        leftSection={<RiEditLine />}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={() => router.push(`/dashboard/sales/productos-app/view/${producto.id}`)}
                                        leftSection={<RiEyeLine />}
                                        className="flex-1"
                                    >
                                        Ver
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="red"
                                        onClick={() => openDeleteModal(producto)}
                                        leftSection={<RiDeleteBinLine />}
                                        className="flex-1"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">No se encontraron Productos App.</div>
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

            {/* ---------------- MODAL DE ELIMINACIÓN ---------------- */}
            <ConfirmDeleteModal
                opened={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeletingProducto(null);
                }}
                onConfirm={handleDeleteProducto}
                title="Eliminar Producto App"
                message={`¿Estás seguro de que deseas eliminar el producto "${deletingProducto?.name}"?`}
                loading={loading}
            />

            {/* ---------------- MODAL DE EXCEL ---------------- */}
            <Modal
                opened={excelModalOpen}
                onClose={() => {
                    setExcelModalOpen(false);
                    setExcelFile(null);
                }}
                title="Cargar Productos App desde Excel"
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

            <ProcessingOverlay
                isProcessing={uploadingExcel}
                showSuccess={showSuccessOverlay}
                successMessage="¡Productos cargados exitosamente!"
                processingMessage="Cargando productos desde Excel..."
                onSuccessClose={() => {
                    setShowSuccessOverlay(false);
                    setUploadingExcel(false);
                }}
            />
        </div>
    );
}
