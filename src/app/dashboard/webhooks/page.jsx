"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listWebhookLogs,
  listWebhookLogsReport,
  downloadWebhookLogsExcel,
} from "@/tada/services/webhookApi";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  Notification,
  Pagination,
  Loader,
  TextInput,
  Button,
  Select,
} from "@mantine/core";
import {
  RiSearchLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiDownloadCloudLine,
} from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [source, setSource] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [filtering, setFiltering] = useState(false);

  /* ------------------- FILTROS APLICADOS ------------------- */
  const [appliedFilters, setAppliedFilters] = useState({
    email: "",
    startDate: null,
    endDate: null,
    source: null,
  });

  /* ------------------- TABLA ------------------- */
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ------------------- GRÁFICOS ------------------- */
  const [sourceChartData, setSourceChartData] = useState([]);
  const [eventTypeChartData, setEventTypeChartData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);

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
      setLogs(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10));
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
     2. Traer datos para GRÁFICOS cuando cambian appliedFilters
  ========================================================= */
  const fetchLogsReport = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await listWebhookLogsReport(
        accessToken,
        appliedFilters.email,
        appliedFilters.startDate,
        appliedFilters.endDate,
        appliedFilters.source
      );

      /* -- Por source -- */
      const sourceCounts = data.reduce((acc, log) => {
        const src = log.source || "unknown";
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {});
      setSourceChartData(
        Object.entries(sourceCounts)
          .map(([source, count]) => ({
            source,
            count,
            fill: getSourceColor(source),
          }))
          .sort((a, b) => b.count - a.count)
      );

      /* -- Por event_type -- */
      const eventCounts = data.reduce((acc, log) => {
        const evt = log.event_type || "unknown";
        acc[evt] = (acc[evt] || 0) + 1;
        return acc;
      }, {});
      setEventTypeChartData(
        Object.entries(eventCounts)
          .map(([type, count]) => ({
            type,
            count,
            fill: getEventTypeColor(type),
          }))
          .sort((a, b) => b.count - a.count)
      );

      setShowCharts(true);
    } catch (err) {
      console.error(err);
      setSourceChartData([]);
      setEventTypeChartData([]);
      setShowCharts(false);
    }
  }, [accessToken, appliedFilters]);

  useEffect(() => {
    /* Solo si hay algún filtro aplicado */
    if (
      appliedFilters.email ||
      appliedFilters.startDate ||
      appliedFilters.endDate ||
      appliedFilters.source
    ) {
      fetchLogsReport();
    } else {
      setShowCharts(false);
      setSourceChartData([]);
      setEventTypeChartData([]);
    }
  }, [fetchLogsReport, appliedFilters]);

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
      setEmail("");
      setStartDate(null);
      setEndDate(null);
      setSource(null);
      setAppliedFilters({
        email: "",
        startDate: null,
        endDate: null,
        source: null,
      });
      setPage(1);
    } finally {
      setFiltering(false);
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

      {/* ---------------- GRÁFICOS ---------------- */}
      {showCharts && (
        <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-4">
          <div className="card bg-base-100 shadow-xl p-4">
            <h2 className="text-lg text-black font-bold text-center mb-4">
              Webhooks por Origen
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceChartData}>
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    color: "black",
                    border: "1px solid #ddd",
                  }}
                />
                <Bar dataKey="count">
                  {sourceChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card bg-base-100 shadow-xl p-4">
            <h2 className="text-lg text-black font-bold text-center mb-4">
              Webhooks por Tipo de Evento
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeChartData}>
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    color: "black",
                    border: "1px solid #ddd",
                  }}
                />
                <Bar dataKey="count">
                  {eventTypeChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
              <th>Origen</th>
              <th>Tipo de Evento</th>
              <th>Fecha</th>
              <th>Hora</th>
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
                    <span
                      className="badge badge-sm"
                      style={{
                        backgroundColor: getSourceColor(log.source),
                        color: "white",
                      }}
                    >
                      {getSourceLabel(log.source)}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge badge-sm"
                      style={{
                        backgroundColor: getEventTypeColor(log.event_type),
                        color: "white",
                      }}
                    >
                      {getEventTypeLabel(log.event_type)}
                    </span>
                  </td>
                  <td>{log.date}</td>
                  <td>{log.time}</td>
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

              <div className="flex gap-2 mb-2">
                <span
                  className="badge badge-sm"
                  style={{
                    backgroundColor: getSourceColor(log.source),
                    color: "white",
                  }}
                >
                  {getSourceLabel(log.source)}
                </span>
                <span
                  className="badge badge-sm"
                  style={{
                    backgroundColor: getEventTypeColor(log.event_type),
                    color: "white",
                  }}
                >
                  {getEventTypeLabel(log.event_type)}
                </span>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {log.date} - {log.time}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">No se encontraron logs.</div>
        )}
      </div>

      <Pagination
        value={page}
        onChange={setPage}
        total={totalPages}
        className="mt-6"
      />
    </div>
  );
}
