"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listWebhookLogs,
  downloadWebhookLogsExcel,
  updateWebhookLog,
} from "@/tada/services/webhookApi";
import { useAuth } from "@/auth/hooks/useAuth";
import { getUsersByRole } from "@/auth/services/userApi";
import {
  Notification,
  Pagination,
  Loader,
  TextInput,
  Button,
  Select,
  Modal,
  Textarea,
  Switch,
} from "@mantine/core";
import {
  RiSearchLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiDownloadCloudLine,
  RiEditLine,
  RiEyeLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { Unauthorized } from "@/core/components/Unauthorized";

const PERMISSION_PATH = "/dashboard/webhooks";

const SOURCE_OPTIONS = [
  { value: "cancelled_orders", label: "Órdenes Canceladas" },
  { value: "completed_orders", label: "Órdenes Completadas" },
  { value: "pending_orders", label: "Órdenes Pendientes" },
  { value: "unknown", label: "Desconocido" },
];

const getSourceLabel = (source) => {
  const labels = {
    cancelled_orders: "Cancelado",
    completed_orders: "Completado",
    pending_orders: "Pendiente",
    unknown: "Desconocido",
  };
  return labels[source] || source;
};

const getEventTypeLabel = (eventType) => {
  const labels = {
    order_cancelled: "Orden Cancelada",
    order_completed: "Orden Completada",
    order_pending: "Orden Pendiente",
    unknown: "Desconocido",
  };
  return labels[eventType] || eventType;
};

const getSourceColor = (source) => {
  const colors = {
    cancelled_orders: "#EF4444",
    completed_orders: "#10B981",
    pending_orders: "#F59E0B",
    unknown: "#6B7280",
  };
  return colors[source] || "#6B7280";
};

const getEventTypeColor = (eventType) => {
  const colors = {
    order_cancelled: "#EF4444",
    order_completed: "#10B981",
    order_pending: "#F59E0B",
    unknown: "#6B7280",
  };
  return colors[eventType] || "#6B7280";
};

/* =================== COMPONENTE =================== */
export default function WebhooksPage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  // Función para obtener fechas por defecto
  const getDefaultDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();

  /* ------------------- AUTORIZACIÓN ------------------- */
  const [authorized, setAuthorized] = useState(null);
  useEffect(() => {
    const ok =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
    setAuthorized(!!ok);
  }, [user, router]);

  /* ------------------- FILTROS (inputs) ------------------- */
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [source, setSource] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [filtering, setFiltering] = useState(false);

  /* ------------------- FILTROS APLICADOS ------------------- */
  const [appliedFilters, setAppliedFilters] = useState({
    email: "",
    startDate: defaultDates.start,
    endDate: defaultDates.end,
    source: null,
  });

  /* ------------------- TABLA ------------------- */
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  /* ------------------- MÉTRICAS ------------------- */
  const [showMetrics, setShowMetrics] = useState(false);

  /* ------------------- MODAL DE EDICIÓN ------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    poc: "",
    comment: "",
    repurchased: false,
  });
  const [storeUsers, setStoreUsers] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  /* ------------------- MODAL DE PREVIEW ------------------- */
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewingLog, setPreviewingLog] = useState(null);

  /* =========================================================
     1. Traer LOGS cada vez que cambian page o appliedFilters
  ========================================================= */
  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listWebhookLogs(
        accessToken,
        page,
        appliedFilters.email,
        appliedFilters.startDate,
        appliedFilters.endDate,
        appliedFilters.source
      );
      const results = data.results || [];
      setLogs(results);

      // Calcular páginas totales basándose en el count del backend
      const itemsPerPage = 10;
      const count = data.count || 0;
      setTotalRecords(count);
      setTotalPages(Math.ceil(count / itemsPerPage));

      // Mostrar métricas si hay registros
      setShowMetrics(count > 0);

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los logs de webhooks");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, appliedFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* =========================================================
     Cargar usuarios del rol Store
  ========================================================= */
  useEffect(() => {
    const fetchStoreUsers = async () => {
      if (!accessToken) return;
      setLoadingStores(true);
      try {
        const data = await getUsersByRole("Store", accessToken);
        console.log("Usuarios Store obtenidos:", data);
        // Transformar a formato para Select de Mantine
        const usersOptions = data.users.map((user) => ({
          value: user.name,
          label: user.name,
        }));
        setStoreUsers(usersOptions);
      } catch (err) {
        console.error("Error al cargar usuarios Store:", err);
        setStoreUsers([]);
      } finally {
        setLoadingStores(false);
      }
    };

    if (authorized && accessToken) {
      fetchStoreUsers();
    }
  }, [authorized, accessToken]);



  /* =========================================================
     3. Handlers
  ========================================================= */
  const applyFilters = async () => {
    setFiltering(true);
    try {
      setAppliedFilters({
        email: email,
        startDate: startDate,
        endDate: endDate,
        source: source,
      });
      setPage(1);
    } finally {
      setFiltering(false);
    }
  };

  const clearFilters = async () => {
    setFiltering(true);
    try {
      const defaultDates = getDefaultDates();
      setEmail("");
      setStartDate(defaultDates.start);
      setEndDate(defaultDates.end);
      setSource(null);
      setAppliedFilters({
        email: "",
        startDate: defaultDates.start,
        endDate: defaultDates.end,
        source: null,
      });
      setPage(1);
    } finally {
      setFiltering(false);
    }
  };

  const openPreviewModal = (log) => {
    setPreviewingLog(log);
    setPreviewModalOpen(true);
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setFormData({
      poc: log.poc || "",
      comment: log.comment || "",
      repurchased: log.repurchased || false,
    });
    setModalOpen(true);
  };

  const handleUpdateWebhook = async () => {
    if (!editingLog) return;

    setLoading(true);
    try {
      await updateWebhookLog(accessToken, editingLog.id, formData);
      setModalOpen(false);
      setEditingLog(null);
      setFormData({ poc: "", comment: "", repurchased: false });
      await fetchLogs();
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al actualizar el webhook");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     4. Render
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
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      {/* ---------------- FILTROS ---------------- */}
      <div className="grid md:grid-cols-4 grid-cols-1 gap-2 mb-4 items-end">
        <TextInput
          label="Email"
          placeholder="Buscar por email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftSection={<RiSearchLine />}
        />
        <TextInput
          type="date"
          label="Desde"
          value={startDate || ""}
          onChange={(e) => setStartDate(e.target.value || null)}
          leftSection={<RiSearchLine />}
        />
        <TextInput
          type="date"
          label="Hasta"
          value={endDate || ""}
          onChange={(e) => setEndDate(e.target.value || null)}
          leftSection={<RiSearchLine />}
        />
        <Select
          data={SOURCE_OPTIONS}
          label="Origen"
          placeholder="Selecciona origen"
          value={source}
          onChange={setSource}
        />
        <Button
          onClick={applyFilters}
          variant="filled"
          leftSection={<RiSearchLine />}
          disabled={loading || filtering || downloadingExcel}
        >
          {filtering ? <Loader size="xs" color="white" /> : "Buscar"}
        </Button>

        <Button
          onClick={async () => {
            try {
              setDownloadingExcel(true);
              await downloadWebhookLogsExcel(
                accessToken,
                email,
                startDate,
                endDate,
                source
              );
            } catch (err) {
              console.error("Error al descargar:", err);
            } finally {
              setDownloadingExcel(false);
            }
          }}
          variant="filled"
          leftSection={
            downloadingExcel ? (
              <Loader size="xs" color="white" />
            ) : (
              <RiDownloadCloudLine />
            )
          }
          disabled={loading || filtering || downloadingExcel}
        >
          {downloadingExcel ? "Descargando..." : "Descargar Excel"}
        </Button>

        <Button
          onClick={clearFilters}
          variant="outline"
          leftSection={<RiCloseCircleLine />}
          disabled={loading || filtering || downloadingExcel}
        >
          {filtering ? <Loader size="xs" color="gray" /> : "Limpiar"}
        </Button>

        <Button
          onClick={() => {
            setPage(1);
            fetchLogs();
          }}
          variant="outline"
          leftSection={<RiRefreshLine />}
          disabled={loading || filtering || downloadingExcel}
        >
          Refrescar
        </Button>
      </div>

      {/* ---------------- MÉTRICAS ---------------- */}
      {showMetrics && (
        <div className="mb-4">
          <div className="card bg-white shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 uppercase mb-2">
              Total de Registros
            </div>
            <div className="text-4xl font-bold text-black">
              {totalRecords}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TABLA + PAGINACIÓN ---------------- */}
      <div className="hidden md:block overflow-x-auto rounded-md">
        <table className="table w-full">
          <thead className="bg-primary text-white text-md uppercase font-bold">
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Recompra</th>
              <th>Gestionado</th>
              <th>Creado</th>
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
            ) : logs.length ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-100">
                  <td className="font-bold">{log.name || "N/A"}</td>
                  <td className="lowercase italic">{log.email}</td>
                  <td>
                    {log.repurchased ? (
                      <span className="badge badge-success badge-sm">Sí</span>
                    ) : (
                      <span className="badge badge-ghost badge-sm">No</span>
                    )}
                  </td>
                  <td>{log.edited_by || "-"}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <Button.Group>
                      <Button
                        size="xs"
                        onClick={() => openEditModal(log)}
                        leftSection={<RiEditLine />}
                        title="Editar registro"
                      >
                        Editar
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => openPreviewModal(log)}
                        leftSection={<RiEyeLine />}
                        title="Ver detalles"
                      >
                        Ver
                      </Button>
                    </Button.Group>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No se encontraron logs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista móvil */}
      <div className="md:hidden block space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <Loader size="sm" color="blue" />
          </div>
        ) : logs.length ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
            >
              <div className="mb-1 font-semibold">Nombre:</div>
              <div className="mb-2">{log.name || "N/A"}</div>

              <div className="mb-1 font-semibold">Email:</div>
              <div className="lowercase mb-2">{log.email}</div>

              <div className="mb-1 font-semibold">Recompra:</div>
              <div className="mb-2">
                {log.repurchased ? (
                  <span className="badge badge-success badge-sm">Sí</span>
                ) : (
                  <span className="badge badge-ghost badge-sm">No</span>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {new Date(log.created_at).toLocaleString()}
              </div>

              {log.edited_by && (
                <>
                  <div className="mb-1 font-semibold">Gestionado:</div>
                  <div className="mb-2">{log.edited_by}</div>
                </>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  size="xs"
                  onClick={() => openEditModal(log)}
                  leftSection={<RiEditLine />}
                  className="w-full"
                >
                  Editar
                </Button>
                <Button
                  size="xs"
                  onClick={() => openPreviewModal(log)}
                  leftSection={<RiEyeLine />}
                  className="w-full"
                >
                  Ver
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">No se encontraron logs.</div>
        )}
      </div>

      {/* Paginación */}
      <Pagination
        value={page}
        onChange={setPage}
        total={totalPages}
        siblings={1}
        boundaries={1}
        className="mt-6"
      />

      {/* ---------------- MODAL DE EDICIÓN ---------------- */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLog(null);
          setFormData({ poc: "", comment: "", repurchased: false });
        }}
        title="Editar Webhook"
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
          {editingLog && (
            <div className="mb-4 p-3 bg-gray-100 rounded-md">
              <div className="text-sm">
                <strong>Email:</strong> {editingLog.email}
              </div>
              <div className="text-sm">
                <strong>Nombre:</strong> {editingLog.name || "N/A"}
              </div>
            </div>
          )}

          <Select
            label="POC"
            placeholder="Selecciona un POC"
            value={formData.poc}
            onChange={(value) =>
              setFormData({ ...formData, poc: value || "" })
            }
            data={storeUsers}
            searchable
            clearable
            disabled={loadingStores}
            nothingFoundMessage="No se encontraron usuarios"
          />

          <Textarea
            label="Comentario"
            placeholder="Agrega un comentario sobre este registro"
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.currentTarget.value })
            }
            minRows={3}
            maxLength={150}
          />

          <Switch
            label="¿Recompró?"
            checked={formData.repurchased}
            onChange={(e) =>
              setFormData({ ...formData, repurchased: e.currentTarget.checked })
            }
          />

          <Button
            className="btn btn-info btn-sm"
            fullWidth
            onClick={handleUpdateWebhook}
            loading={loading}
          >
            Actualizar Webhook
          </Button>
        </div>
      </Modal>

      {/* ---------------- MODAL DE PREVIEW ---------------- */}
      <Modal
        opened={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewingLog(null);
        }}
        title="Detalles del Webhook"
        centered
        className="text-black"
      >
        {previewingLog && (
          <div className="space-y-3 text-black">
            <div>
              <strong>Nombre:</strong> {previewingLog.name || "N/A"}
            </div>
            <div>
              <strong>Email:</strong> {previewingLog.email}
            </div>
            <div>
              <strong>Tipo de Evento:</strong>{" "}
              <span
                className="badge badge-sm"
                style={{
                  backgroundColor: getEventTypeColor(previewingLog.event_type),
                  color: "white",
                }}
              >
                {getEventTypeLabel(previewingLog.event_type)}
              </span>
            </div>
            <div>
              <strong>POC:</strong> {previewingLog.poc || "-"}
            </div>
            <div>
              <strong>Comentario:</strong>
              <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md mt-1">
                {previewingLog.comment || "-"}
              </p>
            </div>
            <div>
              <strong>Recompra:</strong>{" "}
              {previewingLog.repurchased ? (
                <span className="badge badge-success badge-sm">Sí</span>
              ) : (
                <span className="badge badge-ghost badge-sm">No</span>
              )}
            </div>
            <div>
              <strong>Creado:</strong>{" "}
              {new Date(previewingLog.created_at).toLocaleString()}
            </div>
            {previewingLog.is_edited && (
              <>
                <div>
                  <strong>Gestionado:</strong> {previewingLog.edited_by}
                </div>
                <div>
                  <strong>Fecha de gestión:</strong>{" "}
                  {new Date(previewingLog.edited_at).toLocaleString()}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}