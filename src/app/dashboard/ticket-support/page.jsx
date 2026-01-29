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
    Checkbox,
    Textarea,
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
import { listPocs } from "@/tada/services/pocsCrudApi";
import {
    searchTicketSupports,
    createTicketSupport,
    updateTicketSupport,
    deleteTicketSupport,
    bulkCreateTicketSupportsFromExcel,
    downloadTicketSupportTemplate,
    downloadAllTicketSupports,
} from "@/tada/services/ticketSupportApi";

const PERMISSION_PATH = "/dashboard/ticket-support";

export default function TicketSupportPage() {
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
    const getMonthStart = () =>
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .slice(0, 10);

    const getMonthEnd = () =>
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            .toISOString()
            .slice(0, 10);

    const [search, setSearch] = useState("");
    const [idTicket, setIdTicket] = useState("");
    const [esTienda, setEsTienda] = useState(null);
    const [startDate, setStartDate] = useState(getMonthStart());
    const [endDate, setEndDate] = useState(getMonthEnd());
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        idTicket: "",
        esTienda: null,
        startDate: getMonthStart(),
        endDate: getMonthEnd(),
    });

    /* ------------------- TABLA ------------------- */
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /* ------------------- POCS (para dropdown) ------------------- */
    const [pocsList, setPocsList] = useState([]);
    const [loadingPocs, setLoadingPocs] = useState(false);

    /* ------------------- MODAL DE EDICIÓN/CREACIÓN ------------------- */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [formData, setFormData] = useState({
        id_ticket: "",
        titulo_caso: "",
        hora_inicio: "",
        hora_fin: "",
        justificacion: "",
        es_tienda: false,
        poc: null,
    });

    /* ------------------- MODAL DE PREVIEW ------------------- */
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewingTicket, setPreviewingTicket] = useState(null);

    /* ------------------- MODAL DE ELIMINACIÓN ------------------- */
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingTicket, setDeletingTicket] = useState(null);

    /* ------------------- MODAL DE EXCEL ------------------- */
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [savingTicket, setSavingTicket] = useState(false);

    /* =========================================================
       Cargar POCs para el dropdown
    ========================================================= */
    const fetchPocs = async () => {
        setLoadingPocs(true);
        try {
            // El backend limita a 10 por página, así que obtenemos todas las páginas
            let response = await listPocs(accessToken, 1, null, null, null, null, null, 50);
            let allPocs = [...response.results];
            
            // Si hay más páginas, las obtenemos todas
            let currentPage = 1;
            const totalPages = Math.ceil(response.count / response.results.length);
            console.log(`Total POCs: ${response.count}, Total Páginas: ${totalPages}`);
            
            while (currentPage < totalPages && response.next) {
                currentPage++;
                response = await listPocs(accessToken, currentPage, null, null, null, null, null, 50);
                allPocs = [...allPocs, ...response.results];
            }
            
            // console.log(`POCs cargados: ${allPocs.length} de ${response.count}`);
            setPocsList(allPocs);
        } catch (err) {
            console.error("Error al cargar POCs:", err);
        } finally {
            setLoadingPocs(false);
        }
    };

    useEffect(() => {
        if (accessToken && modalOpen && formData.es_tienda) {
            fetchPocs();
        }
    }, [accessToken, modalOpen, formData.es_tienda]);

    /* =========================================================
       Traer Tickets
    ========================================================= */
    const fetchTickets = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await searchTicketSupports(
                accessToken,
                page,
                appliedFilters.search,
                appliedFilters.idTicket,
                appliedFilters.esTienda,
                10,
                appliedFilters.startDate,
                appliedFilters.endDate
            );
            console.log(data)
            setTickets(data.results || []);
            setTotalPages(Math.ceil((data.count || 0) / 10));
            setTotalRecords(data.count || 0);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los tickets");
        } finally {
            setLoading(false);
        }
    }, [accessToken, page, appliedFilters]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({
                search,
                idTicket,
                esTienda,
                startDate,
                endDate,
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
            setIdTicket("");
            setStartDate(getMonthStart());
            setEndDate(getMonthEnd());
            setEsTienda(null);
            setAppliedFilters({
                search: "",
                idTicket: "",
                esTienda: null,
                startDate: getMonthStart(),
                endDate: getMonthEnd(),
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };

    const openPreviewModal = async (ticket) => {
        setPreviewingTicket(ticket);
        setPreviewModalOpen(true);
    };

    const openEditModal = async (ticket) => {
        setEditingTicket(ticket);
        setFormData({
            id_ticket: ticket.id_ticket || "",
            titulo_caso: ticket.titulo_caso || "",
            hora_inicio: ticket.hora_inicio ? ticket.hora_inicio.slice(0, 16) : "",
            hora_fin: ticket.hora_fin ? ticket.hora_fin.slice(0, 16) : "",
            justificacion: ticket.justificacion_preview || ticket.justificacion || "",
            es_tienda: ticket.es_tienda || false,
            poc: ticket.poc || null,
        });
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingTicket(null);
        setFormData({
            id_ticket: "",
            titulo_caso: "",
            hora_inicio: "",
            hora_fin: "",
            justificacion: "",
            es_tienda: false,
            poc: null,
        });
        setModalOpen(true);
    };

    const handleSaveTicket = async () => {
        setSavingTicket(true);
        try {
            const payload = {
                id_ticket: formData.id_ticket,
                titulo_caso: formData.titulo_caso,
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                justificacion: formData.justificacion,
                es_tienda: formData.es_tienda,
                poc: formData.es_tienda ? formData.poc : null,
            };

            if (editingTicket) {
                await updateTicketSupport(accessToken, editingTicket.id, payload);
            } else {
                await createTicketSupport(accessToken, payload);
            }

            setModalOpen(false);
            fetchTickets();
        } catch (err) {
            alert(err.message);
        } finally {
            setSavingTicket(false);
        }
    };

    const openDeleteModal = (ticket) => {
        setDeletingTicket(ticket);
        setDeleteModalOpen(true);
    };

    const handleDeleteTicket = async () => {
        try {
            await deleteTicketSupport(accessToken, deletingTicket.id);
            setDeleteModalOpen(false);
            fetchTickets();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUploadExcel = async () => {
        if (!excelFile) return;
        setUploadingExcel(true);
        try {
            await bulkCreateTicketSupportsFromExcel(accessToken, excelFile);
            setExcelModalOpen(false);
            setExcelFile(null);
            setShowSuccessOverlay(true);
            setTimeout(() => {
                setShowSuccessOverlay(false);
                fetchTickets();
            }, 2000);
        } catch (err) {
            alert(err.message);
        } finally {
            setUploadingExcel(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadTicketSupportTemplate(accessToken);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDownloadAll = async () => {
        try {
            await downloadAllTicketSupports(accessToken);
        } catch (err) {
            alert(err.message);
        }
    };

    /* =========================================================
       Render
    ========================================================= */
    if (authorized === null) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
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
                        Agregar Soporte Ticket
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
                        onClick={handleDownloadTemplate}
                        variant="outline"
                        leftSection={<RiDownloadCloudLine />}
                        className="flex-1 md:flex-none"
                    >
                        Plantilla
                    </Button>
                    <Button
                        onClick={handleDownloadAll}
                        variant="outline"
                        leftSection={<RiDownloadCloudLine />}
                        className="flex-1 md:flex-none"
                    >
                        Exportar
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
                                        placeholder="Buscar..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        leftSection={<RiSearchLine />}
                                    />
                                    <TextInput
                                        label="ID Ticket"
                                        placeholder="ID del ticket"
                                        value={idTicket}
                                        onChange={(e) => setIdTicket(e.target.value)}
                                    />
                                    <Select
                                        label="Es Tienda"
                                        placeholder="Seleccionar"
                                        value={esTienda !== null ? String(esTienda) : null}
                                        onChange={(val) => setEsTienda(val === null ? null : val === "true")}
                                        data={[
                                            { value: "true", label: "Sí" },
                                            { value: "false", label: "No" },
                                        ]}
                                        clearable
                                    />
                                    <TextInput
                                        label="Fecha Inicial"
                                        type="date"
                                        placeholder="YYYY-MM-DD"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <TextInput
                                        label="Fecha Final"
                                        type="date"
                                        placeholder="YYYY-MM-DD"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
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
                                            fetchTickets();
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
                <div className="hidden md:grid md:grid-cols-4 grid-cols-1 gap-2 items-end">
                    <TextInput
                        label="Buscar"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftSection={<RiSearchLine />}
                    />
                    <TextInput
                        label="ID Ticket"
                        placeholder="ID del ticket"
                        value={idTicket}
                        onChange={(e) => setIdTicket(e.target.value)}
                    />
                    <Select
                        label="Es Tienda"
                        placeholder="Seleccionar"
                        value={esTienda !== null ? String(esTienda) : null}
                        onChange={(val) => setEsTienda(val === null ? null : val === "true")}
                        data={[
                            { value: "true", label: "Sí" },
                            { value: "false", label: "No" },
                        ]}
                        clearable
                    />
                    <TextInput
                        label="Fecha Inicial"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <TextInput
                        label="Fecha Final"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
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
                            fetchTickets();
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
                            Total de Tickets
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
                                <th>ID Ticket</th>
                                <th>Título Caso</th>
                                <th>Duración (min)</th>
                                <th>Es Tienda</th>
                                <th>POC</th>
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
                            ) : tickets.length ? (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-gray-100">
                                        <td className="font-bold">{ticket.id_ticket}</td>
                                        <td>{ticket.titulo_caso}</td>
                                        <td className="font-semibold">{ticket.duracion_caso || 0}</td>
                                        <td>
                                            <span
                                                className={`badge badge-sm ${
                                                    ticket.es_tienda ? "badge-success" : "badge-ghost"
                                                }`}
                                            >
                                                {ticket.es_tienda ? "Sí" : "No"}
                                            </span>
                                        </td>
                                        <td>{ticket.poc_name || "-"}</td>
                                        <td>
                                            <Button.Group>
                                                <Button
                                                    size="xs"
                                                    onClick={() => openEditModal(ticket)}
                                                    leftSection={<RiEditLine />}
                                                    title="Editar Ticket"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    onClick={() => openPreviewModal(ticket)}
                                                    leftSection={<RiEyeLine />}
                                                    title="Ver detalles"
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => openDeleteModal(ticket)}
                                                    leftSection={<RiDeleteBinLine />}
                                                    title="Eliminar Ticket"
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
                                        No se encontraron tickets.
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
                    ) : tickets.length ? (
                        tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                            >
                                <div className="mb-1 font-semibold">ID Ticket:</div>
                                <div className="mb-2">{ticket.id_ticket}</div>

                                <div className="mb-1 font-semibold">Título Caso:</div>
                                <div className="mb-2">{ticket.titulo_caso}</div>

                                <div className="mb-1 font-semibold">Duración:</div>
                                <div className="mb-2 font-semibold text-blue-600">
                                    {ticket.duracion_caso || 0} minutos
                                </div>

                                <div className="mb-1 font-semibold">Es Tienda:</div>
                                <div className="flex gap-2 mb-2">
                                    <span
                                        className={`badge badge-sm ${
                                            ticket.es_tienda ? "badge-success" : "badge-ghost"
                                        }`}
                                    >
                                        {ticket.es_tienda ? "Sí" : "No"}
                                    </span>
                                </div>

                                {ticket.es_tienda && (
                                    <>
                                        <div className="mb-1 font-semibold">POC:</div>
                                        <div className="mb-2">{ticket.poc_name || "-"}</div>
                                    </>
                                )}

                                <div className="text-xs text-gray-500 mt-2">
                                    Creado: {new Date(ticket.created_at || ticket.hora_inicio).toLocaleString()}
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="xs"
                                        onClick={() => openEditModal(ticket)}
                                        leftSection={<RiEditLine />}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={() => openPreviewModal(ticket)}
                                        leftSection={<RiEyeLine />}
                                        className="flex-1"
                                    >
                                        Ver
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="red"
                                        onClick={() => openDeleteModal(ticket)}
                                        leftSection={<RiDeleteBinLine />}
                                        className="flex-1"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">No se encontraron tickets.</div>
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
                    setEditingTicket(null);
                }}
                title={editingTicket ? "Editar Soporte Ticket" : "Agregar Soporte Ticket"}
                centered
                size="lg"
                className="text-black"
            >
                <div className="space-y-4 text-black">
                    <TextInput
                        label="ID Ticket"
                        placeholder="TICKET-123"
                        required
                        value={formData.id_ticket}
                        onChange={(e) =>
                            setFormData({ ...formData, id_ticket: e.currentTarget.value })
                        }
                    />
                    <TextInput
                        label="Título Caso"
                        placeholder="Cliente insatisfecho"
                        required
                        value={formData.titulo_caso}
                        onChange={(e) =>
                            setFormData({ ...formData, titulo_caso: e.currentTarget.value })
                        }
                    />
                    <TextInput
                        label="Hora Inicio"
                        type="datetime-local"
                        required
                        value={formData.hora_inicio}
                        onChange={(e) =>
                            setFormData({ ...formData, hora_inicio: e.currentTarget.value })
                        }
                    />
                    <TextInput
                        label="Hora Fin"
                        type="datetime-local"
                        required
                        value={formData.hora_fin}
                        onChange={(e) =>
                            setFormData({ ...formData, hora_fin: e.currentTarget.value })
                        }
                    />
                    <Textarea
                        label="Justificación"
                        placeholder="El cliente reportó..."
                        required
                        minRows={4}
                        value={formData.justificacion}
                        onChange={(e) =>
                            setFormData({ ...formData, justificacion: e.currentTarget.value })
                        }
                    />
                    <Checkbox
                        label="Es Tienda"
                        checked={formData.es_tienda}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                es_tienda: e.currentTarget.checked,
                                poc: e.currentTarget.checked ? formData.poc : null,
                            })
                        }
                    />
                    {formData.es_tienda && (
                        <Select
                            label="Seleccionar POC"
                            placeholder={loadingPocs ? "Cargando POCs..." : "Seleccione un POC"}
                            required
                            searchable
                            data={pocsList.map((poc) => ({
                                value: String(poc.id),
                                label: `${poc.id_poc} - ${poc.name} (${poc.city})`,
                            }))}
                            value={formData.poc ? String(formData.poc) : null}
                            onChange={(val) =>
                                setFormData({ ...formData, poc: parseInt(val) })
                            }
                            disabled={loadingPocs}
                            rightSection={loadingPocs ? <Loader size="xs" /> : null}
                        />
                    )}

                    <Button
                        fullWidth
                        onClick={handleSaveTicket}
                        loading={savingTicket}
                        disabled={
                            savingTicket ||
                            !formData.id_ticket ||
                            !formData.titulo_caso ||
                            !formData.hora_inicio ||
                            !formData.hora_fin ||
                            !formData.justificacion ||
                            (formData.es_tienda && !formData.poc)
                        }
                    >
                        {editingTicket ? "Actualizar" : "Agregar"}
                    </Button>
                </div>
            </Modal>

            {/* ---------------- MODAL DE PREVIEW ---------------- */}
            <Modal
                opened={previewModalOpen}
                onClose={() => {
                    setPreviewModalOpen(false);
                    setPreviewingTicket(null);
                }}
                title="Detalles del Ticket"
                centered
                className="text-black"
            >
                {previewingTicket && (
                    <div className="space-y-3 text-black">
                        <div>
                            <strong>ID Ticket:</strong> {previewingTicket.id_ticket}
                        </div>
                        <div>
                            <strong>Título Caso:</strong> {previewingTicket.titulo_caso}
                        </div>
                        <div>
                            <strong>Hora Inicio:</strong>{" "}
                            {new Date(previewingTicket.hora_inicio).toLocaleString("es-ES")}
                        </div>
                        <div>
                            <strong>Hora Fin:</strong>{" "}
                            {new Date(previewingTicket.hora_fin).toLocaleString("es-ES")}
                        </div>
                        <div>
                            <strong>Justificación:</strong>
                            <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                                {previewingTicket.justificacion_preview || previewingTicket.justificacion}
                            </div>
                        </div>
                        <div>
                            <strong>Es Tienda:</strong>{" "}
                            {previewingTicket.es_tienda ? (
                                <span className="badge badge-success badge-sm">Sí</span>
                            ) : (
                                <span className="badge badge-ghost badge-sm">No</span>
                            )}
                        </div>
                        {previewingTicket.es_tienda && previewingTicket.poc_name && (
                            <div>
                                <strong>POC:</strong> {previewingTicket.poc_name}
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
                    setDeletingTicket(null);
                }}
                onConfirm={handleDeleteTicket}
                title="Eliminar Ticket"
                message={`¿Estás seguro de que deseas eliminar el ticket "${deletingTicket?.id_ticket}"?`}
                loading={loading}
            />

            {/* ---------------- MODAL DE EXCEL ---------------- */}
            <Modal
                opened={excelModalOpen}
                onClose={() => {
                    setExcelModalOpen(false);
                    setExcelFile(null);
                }}
                title="Cargar Tickets desde Excel"
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
                successMessage="¡Tickets cargados exitosamente!"
                processingMessage="Cargando tickets desde Excel..."
                onSuccessClose={() => {
                    setShowSuccessOverlay(false);
                    setUploadingExcel(false);
                }}
            />
        </div>
    );
}
