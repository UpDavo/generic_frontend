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
import {
    listPocs,
    getPocById,
    createPoc,
    patchPoc,
    deletePoc,
    bulkCreatePocsFromExcel,
    downloadPocsTemplate,
} from "@/tada/services/pocsCrudApi";

const PERMISSION_PATH = "/dashboard/sales/pocs";

const REGION_OPTIONS = [
    { value: "costa", label: "Costa" },
    { value: "sierra", label: "Sierra" },
    { value: "oriente", label: "Oriente" },
    { value: "insular", label: "Insular" },
];

const getRegionLabel = (region) => {
    const labels = {
        costa: "Costa",
        sierra: "Sierra",
        oriente: "Oriente",
        insular: "Insular",
    };
    return labels[region] || region;
};

const getRegionColor = (region) => {
    const colors = {
        costa: "#3B82F6",
        sierra: "#10B981",
        oriente: "#F59E0B",
        insular: "#8B5CF6",
    };
    return colors[region] || "#6B7280";
};

export default function PocsPage() {
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
    const [region, setRegion] = useState(null);
    const [city, setCity] = useState("");
    const [idPoc, setIdPoc] = useState("");
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        region: null,
        city: "",
        idPoc: "",
    });

    /* ------------------- TABLA ------------------- */
    const [pocs, setPocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /* ------------------- MODAL DE EDICIÓN/CREACIÓN ------------------- */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPoc, setEditingPoc] = useState(null);
    const [formData, setFormData] = useState({
        id_poc: "",
        name: "",
        city: "",
        region: "",
        homologated_names: [],
        active: true,
    });
    const [homologatedInput, setHomologatedInput] = useState("");

    /* ------------------- MODAL DE PREVIEW ------------------- */
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewingPoc, setPreviewingPoc] = useState(null);

    /* ------------------- MODAL DE ELIMINACIÓN ------------------- */
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingPoc, setDeletingPoc] = useState(null);

    /* ------------------- MODAL DE EXCEL ------------------- */
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [uploadingExcel, setUploadingExcel] = useState(false);

    /* =========================================================
       Traer POCs
    ========================================================= */
    const fetchPocs = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await listPocs(
                accessToken,
                page,
                appliedFilters.region,
                appliedFilters.active,
                appliedFilters.city,
                appliedFilters.idPoc,
                appliedFilters.search,
                10
            );
            const results = data.results || [];
            setPocs(results);

            const itemsPerPage = 10;
            const count = data.count || 0;
            setTotalRecords(count);
            setTotalPages(Math.ceil(count / itemsPerPage));

            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los POCs");
        } finally {
            setLoading(false);
        }
    }, [accessToken, page, appliedFilters]);

    useEffect(() => {
        fetchPocs();
    }, [fetchPocs]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({
                search: search,
                region: region,
                city: city,
                idPoc: idPoc,
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
            setRegion(null);
            setCity("");
            setIdPoc("");
            setAppliedFilters({
                search: "",
                region: null,
                city: "",
                idPoc: "",
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };

    const openPreviewModal = async (poc) => {
        try {
            const fullPoc = await getPocById(accessToken, poc.id);
            setPreviewingPoc(fullPoc);
            setPreviewModalOpen(true);
        } catch (err) {
            console.error(err);
            setError("Error al obtener los detalles del POC");
        }
    };

    const openEditModal = async (poc) => {
        try {
            const fullPoc = await getPocById(accessToken, poc.id);
            setEditingPoc(fullPoc);
            setFormData({
                id_poc: fullPoc.id_poc || "",
                name: fullPoc.name || "",
                city: fullPoc.city || "",
                region: fullPoc.region || "",
                homologated_names: fullPoc.homologated_names || [],
                active: fullPoc.active ?? true,
            });
            setHomologatedInput(
                (fullPoc.homologated_names || []).join(", ")
            );
            setModalOpen(true);
        } catch (err) {
            console.error(err);
            setError("Error al obtener los detalles del POC");
        }
    };

    const openCreateModal = () => {
        setEditingPoc(null);
        setFormData({
            id_poc: "",
            name: "",
            city: "",
            region: "",
            homologated_names: [],
            active: true,
        });
        setHomologatedInput("");
        setModalOpen(true);
    };

    const handleSavePoc = async () => {
        setLoading(true);
        try {
            const homologatedArray = homologatedInput
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== "");

            const pocData = {
                ...formData,
                homologated_names: homologatedArray,
            };

            if (editingPoc) {
                await patchPoc(accessToken, editingPoc.id, pocData);
            } else {
                await createPoc(accessToken, pocData);
            }

            setModalOpen(false);
            fetchPocs();
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al guardar el POC");
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (poc) => {
        setDeletingPoc(poc);
        setDeleteModalOpen(true);
    };

    const handleDeletePoc = async () => {
        if (!deletingPoc) return;

        setLoading(true);
        try {
            await deletePoc(accessToken, deletingPoc.id);
            setDeleteModalOpen(false);
            setDeletingPoc(null);
            fetchPocs();
        } catch (err) {
            console.error(err);
            setError("Error al eliminar el POC");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadExcel = async () => {
        if (!excelFile) return;

        setUploadingExcel(true);
        try {
            const result = await bulkCreatePocsFromExcel(accessToken, excelFile);
            setExcelModalOpen(false);
            setExcelFile(null);
            fetchPocs();
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
            await downloadPocsTemplate(accessToken);
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
        <div className="text-black h-full flex flex-col">
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
                        Nuevo POC
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
                                        label="ID POC"
                                        placeholder="Ej: POC001"
                                        value={idPoc}
                                        onChange={(e) => setIdPoc(e.target.value)}
                                    />
                                    <TextInput
                                        label="Ciudad"
                                        placeholder="Ej: Guayaquil"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                    <Select
                                        data={REGION_OPTIONS}
                                        label="Región"
                                        placeholder="Selecciona región"
                                        value={region}
                                        onChange={setRegion}
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
                                            fetchPocs();
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
                        label="ID POC"
                        placeholder="Ej: POC001"
                        value={idPoc}
                        onChange={(e) => setIdPoc(e.target.value)}
                    />
                    <TextInput
                        label="Ciudad"
                        placeholder="Ej: Guayaquil"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <Select
                        data={REGION_OPTIONS}
                        label="Región"
                        placeholder="Selecciona región"
                        value={region}
                        onChange={setRegion}
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
                            fetchPocs();
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
                            Total de POCs
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
                                <th>ID POC</th>
                                <th>Nombre</th>
                                <th>Ciudad</th>
                                <th>Región</th>
                                <th>Nombres Homologados</th>
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-black">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4">
                                        <Loader size="sm" color="blue" />
                                    </td>
                                </tr>
                            ) : pocs.length ? (
                                pocs.map((poc) => (
                                    <tr key={poc.id} className="hover:bg-gray-100">
                                        <td className="font-bold">{poc.id_poc}</td>
                                        <td>{poc.name}</td>
                                        <td>{poc.city}</td>
                                        <td>
                                            <span
                                                className="badge badge-sm"
                                                style={{
                                                    backgroundColor: getRegionColor(poc.region),
                                                    color: "white",
                                                }}
                                            >
                                                {getRegionLabel(poc.region)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-ghost badge-sm">
                                                {poc.homologated_names_count || 0}
                                            </span>
                                        </td>
                                        <td>{new Date(poc.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <Button.Group>
                                                <Button
                                                    size="xs"
                                                    onClick={() => openEditModal(poc)}
                                                    leftSection={<RiEditLine />}
                                                    title="Editar POC"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    onClick={() => openPreviewModal(poc)}
                                                    leftSection={<RiEyeLine />}
                                                    title="Ver detalles"
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => openDeleteModal(poc)}
                                                    leftSection={<RiDeleteBinLine />}
                                                    title="Eliminar POC"
                                                >
                                                    Eliminar
                                                </Button>
                                            </Button.Group>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-4">
                                        No se encontraron POCs.
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
                    ) : pocs.length ? (
                        pocs.map((poc) => (
                            <div
                                key={poc.id}
                                className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                            >
                                <div className="mb-1 font-semibold">ID POC:</div>
                                <div className="mb-2">{poc.id_poc}</div>

                                <div className="mb-1 font-semibold">Nombre:</div>
                                <div className="mb-2">{poc.name}</div>

                                <div className="mb-1 font-semibold">Ciudad:</div>
                                <div className="mb-2">{poc.city}</div>

                                <div className="mb-1 font-semibold">Región:</div>
                                <div className="flex gap-2 mb-2">
                                    <span
                                        className="badge badge-sm"
                                        style={{
                                            backgroundColor: getRegionColor(poc.region),
                                            color: "white",
                                        }}
                                    >
                                        {getRegionLabel(poc.region)}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-500 mt-2">
                                    {new Date(poc.created_at).toLocaleString()}
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="xs"
                                        onClick={() => openEditModal(poc)}
                                        leftSection={<RiEditLine />}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={() => openPreviewModal(poc)}
                                        leftSection={<RiEyeLine />}
                                        className="flex-1"
                                    >
                                        Ver
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="red"
                                        onClick={() => openDeleteModal(poc)}
                                        leftSection={<RiDeleteBinLine />}
                                        className="flex-1"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">No se encontraron POCs.</div>
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
                    setEditingPoc(null);
                }}
                title={editingPoc ? "Editar POC" : "Crear POC"}
                centered
                size="lg"
                className="text-black"
            >
                <div className="space-y-4 text-black">
                    <TextInput
                        label="ID POC"
                        placeholder="Ej: POC001"
                        value={formData.id_poc}
                        onChange={(e) =>
                            setFormData({ ...formData, id_poc: e.currentTarget.value })
                        }
                        required
                    />

                    <TextInput
                        label="Nombre"
                        placeholder="Ej: Supermaxi Mall del Sol"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.currentTarget.value })
                        }
                        required
                    />

                    <TextInput
                        label="Ciudad"
                        placeholder="Ej: Guayaquil"
                        value={formData.city}
                        onChange={(e) =>
                            setFormData({ ...formData, city: e.currentTarget.value })
                        }
                        required
                    />

                    <Select
                        data={REGION_OPTIONS}
                        label="Región"
                        placeholder="Selecciona región"
                        value={formData.region}
                        onChange={(value) => setFormData({ ...formData, region: value || "" })}
                        required
                    />

                    <TextInput
                        label="Nombres Homologados (separados por comas)"
                        placeholder="Ej: Supermaxi MDS, Super Mall"
                        value={homologatedInput}
                        onChange={(e) => setHomologatedInput(e.currentTarget.value)}
                    />

                    <Button fullWidth onClick={handleSavePoc} loading={loading}>
                        {editingPoc ? "Actualizar POC" : "Crear POC"}
                    </Button>
                </div>
            </Modal>

            {/* ---------------- MODAL DE PREVIEW ---------------- */}
            <Modal
                opened={previewModalOpen}
                onClose={() => {
                    setPreviewModalOpen(false);
                    setPreviewingPoc(null);
                }}
                title="Detalles del POC"
                centered
                className="text-black"
            >
                {previewingPoc && (
                    <div className="space-y-3 text-black">
                        <div>
                            <strong>ID POC:</strong> {previewingPoc.id_poc}
                        </div>
                        <div>
                            <strong>Nombre:</strong> {previewingPoc.name}
                        </div>
                        <div>
                            <strong>Ciudad:</strong> {previewingPoc.city}
                        </div>
                        <div>
                            <strong>Región:</strong>{" "}
                            <span
                                className="badge badge-sm"
                                style={{
                                    backgroundColor: getRegionColor(previewingPoc.region),
                                    color: "white",
                                }}
                            >
                                {getRegionLabel(previewingPoc.region)}
                            </span>
                        </div>
                        <div>
                            <strong>Nombres Homologados:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(previewingPoc.homologated_names || []).length > 0 ? (
                                    previewingPoc.homologated_names.map((name, idx) => (
                                        <span key={idx} className="badge badge-ghost badge-sm">
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">Sin nombres homologados</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <strong>Estado:</strong>{" "}
                            {previewingPoc.active ? (
                                <span className="badge badge-success badge-sm">Activo</span>
                            ) : (
                                <span className="badge badge-error badge-sm">Inactivo</span>
                            )}
                        </div>
                        <div>
                            <strong>Creado:</strong>{" "}
                            {new Date(previewingPoc.created_at).toLocaleString()}
                        </div>
                        {previewingPoc.updated_at && (
                            <div>
                                <strong>Actualizado:</strong>{" "}
                                {new Date(previewingPoc.updated_at).toLocaleString()}
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
                    setDeletingPoc(null);
                }}
                onConfirm={handleDeletePoc}
                title="Eliminar POC"
                message={`¿Estás seguro de que deseas eliminar el POC "${deletingPoc?.name}"?`}
                loading={loading}
            />

            {/* ---------------- MODAL DE EXCEL ---------------- */}
            <Modal
                opened={excelModalOpen}
                onClose={() => {
                    setExcelModalOpen(false);
                    setExcelFile(null);
                }}
                title="Cargar POCs desde Excel"
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
