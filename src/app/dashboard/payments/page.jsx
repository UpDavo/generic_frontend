"use client";

import { useEffect, useState, useCallback } from "react";
import { listLogsStats } from "@/tada/services/pushApi";
import { listCanvasLogsStats, listWebhookLogsStats } from "@/tada/services/canvasApi";
import { listExecutionLogsStats } from "@/tada/services/executionApi";
import { TextInput, Loader, Notification, Button } from "@mantine/core";
import { RiRefreshLine, RiSearchLine } from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";

const PERMISSION_PATH = "/dashboard/payments";

export default function PaymentsPage() {
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pushError, setPushError] = useState(null);
  const [canvasError, setCanvasError] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [webhookError, setWebhookError] = useState(null);
  const [totalCalls, setTotalCalls] = useState(0);
  const [cost, setCost] = useState(0);
  const [userCalls, setUserCalls] = useState([]);
  const [authorized, setAuthorized] = useState(null);

  // Nuevos estados para las estadísticas separadas
  const [pushStats, setPushStats] = useState(null);
  const [canvasStats, setCanvasStats] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);
  const [webhookStats, setWebhookStats] = useState(null);

  /* Filtro en la tabla */
  const [searchValue, setSearchValue] = useState("");
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: "count",
    direction: "desc",
  });

  const getMonthStart = () =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10); // "YYYY‑MM‑01"

  const getMonthEnd = () =>
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

  /* ---------- fechas por defecto = mes actual ---------- */
  const [sentAtGte, setSentAtGte] = useState(getMonthStart());
  const [sentAtLte, setSentAtLte] = useState(getMonthEnd());

  /* ------------------------- AUTORIZACIÓN ------------------------- */
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
    setAuthorized(!!hasPermission);
  }, [user]);

  /* ------------------------- FETCH FUNCTIONS ---------------------- */
  // Función para obtener estadísticas de PUSH
  const fetchPushStats = useCallback(async () => {
    setPushLoading(true);
    setPushError(null);

    try {
      const pushData = await listLogsStats(
        accessToken,
        1,
        sentAtGte,
        sentAtLte
      );

      //   console.log("Push stats:", pushData);
      setPushStats(pushData);

      return pushData;
    } catch (err) {
      console.error("Error fetching push stats:", err);
      setPushError("Error al cargar estadísticas de Push");
      return null;
    } finally {
      setPushLoading(false);
    }
  }, [accessToken, sentAtGte, sentAtLte]);

  // Función para obtener estadísticas de CANVAS
  const fetchCanvasStats = useCallback(async () => {
    setCanvasLoading(true);
    setCanvasError(null);

    try {
      const canvasData = await listCanvasLogsStats(
        accessToken,
        1,
        sentAtGte,
        sentAtLte
      );

      //   console.log("Canvas stats:", canvasData);
      setCanvasStats(canvasData);

      return canvasData;
    } catch (err) {
      console.error("Error fetching canvas stats:", err);
      setCanvasError("Error al cargar estadísticas de Canvas");
      return null;
    } finally {
      setCanvasLoading(false);
    }
  }, [accessToken, sentAtGte, sentAtLte]);

  // Función para obtener estadísticas de EXECUTION
  const fetchExecutionStats = useCallback(async () => {
    setExecutionLoading(true);
    setExecutionError(null);

    try {
      const executionData = await listExecutionLogsStats(
        accessToken,
        1,
        sentAtGte,
        sentAtLte
      );

      console.log("Execution stats:", executionData);
      setExecutionStats(executionData);

      return executionData;
    } catch (err) {
      console.error("Error fetching execution stats:", err);
      setExecutionError("Error al cargar estadísticas de Execution");
      return null;
    } finally {
      setExecutionLoading(false);
    }
  }, [accessToken, sentAtGte, sentAtLte]);

  // Función para obtener estadísticas de WEBHOOKS
  const fetchWebhookStats = useCallback(async () => {
    setWebhookLoading(true);
    setWebhookError(null);

    try {
      const webhookData = await listWebhookLogsStats(
        accessToken,
        1,
        sentAtGte,
        sentAtLte
      );

      console.log("Webhook stats:", webhookData);
      setWebhookStats(webhookData);

      return webhookData;
    } catch (err) {
      console.error("Error fetching webhook stats:", err);
      setWebhookError("Error al cargar estadísticas de Webhooks");
      return null;
    } finally {
      setWebhookLoading(false);
    }
  }, [accessToken, sentAtGte, sentAtLte]);

  // Función para calcular y actualizar los totales
  const updateTotals = useCallback(() => {
    if (pushStats && canvasStats && executionStats && webhookStats) {
      const totalPushLogs = pushStats.summary?.total_logs || 0;
      const totalCanvasLogs = canvasStats.summary?.total_logs || 0;
      const totalExecutionLogs = executionStats.summary?.total_logs || 0;
      const totalWebhookLogs = webhookStats.summary?.total_logs || 0;
      const totalPushCost = parseFloat(pushStats.summary?.total_cost || 0);
      const totalCanvasCost = parseFloat(canvasStats.summary?.total_cost || 0);
      const totalExecutionCost = parseFloat(
        executionStats.summary?.total_cost || 0
      );
      const totalWebhookCost = parseFloat(webhookStats.summary?.total_cost || 0);

      setTotalCalls(totalPushLogs + totalCanvasLogs + totalExecutionLogs + totalWebhookLogs);
      setCost(totalPushCost + totalCanvasCost + totalExecutionCost + totalWebhookCost);

      // Combinar usuarios de todos los tipos para la tabla
      const allUsers = [];

      // Agregar usuarios de PUSH
      if (pushStats.users_stats) {
        pushStats.users_stats.forEach((user) => {
          allUsers.push({
            user: user.user_first_name,
            count: user.total_logs,
            cost: parseFloat(user.total_cost),
            type: "PUSH",
            email: user.user_email,
          });
        });
      }

      // Agregar usuarios de CANVAS
      if (canvasStats.users_stats) {
        canvasStats.users_stats.forEach((user) => {
          allUsers.push({
            user: user.user_first_name,
            count: user.total_logs,
            cost: parseFloat(user.total_cost),
            type: "CANVAS",
            email: user.user_email,
          });
        });
      }

      // Agregar estadísticas de EXECUTION (no tiene users_stats, solo total)
      if (executionStats.summary && executionStats.summary.total_logs > 0) {
        allUsers.push({
          user: "Toma de datos de reporte",
          count: executionStats.summary.automatic_logs,
          cost: parseFloat(executionStats.summary.automatic_cost),
          type: "EXECUTION",
          email: "system",
        });
        allUsers.push({
          user: "Consulta de datos de reporte",
          count: executionStats.summary.manual_logs,
          cost: parseFloat(executionStats.summary.manual_cost),
          type: "EXECUTION",
          email: "system",
        });
      }

      // Agregar estadísticas de WEBHOOKS
      if (webhookStats.summary && webhookStats.summary.total_logs > 0) {
        allUsers.push({
          user: "Webhooks",
          count: webhookStats.summary.total_logs,
          cost: parseFloat(webhookStats.summary.total_cost),
          type: "WEBHOOK",
          email: "system",
        });
      }

      setUserCalls(allUsers);
    }
  }, [pushStats, canvasStats, executionStats, webhookStats]);

  // Actualizar totales cuando cambien las estadísticas
  useEffect(() => {
    updateTotals();
  }, [updateTotals]);

  // Función principal que ejecuta ambas peticiones en paralelo
  const fetchDashboardData = useCallback(async () => {
    setError(null);

    try {
      // Ejecutar todas las peticiones en paralelo sin bloquear la UI
      await Promise.all([
        fetchPushStats(),
        fetchCanvasStats(),
        fetchExecutionStats(),
        fetchWebhookStats(),
      ]);
    } catch (err) {
      console.error("Error general:", err);
      setError("Error al cargar los datos del dashboard.");
    }
  }, [fetchPushStats, fetchCanvasStats, fetchExecutionStats, fetchWebhookStats]);

  // 2. Llamada inicial SOLO una vez al montar
  useEffect(() => {
    fetchDashboardData();
  }, []); //  ← vacío: ya no depende de las fechas

  /* ------------------------- RENDER ------------------------------- */
  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-8 bg-white rounded-md shadow-lg">
        <p className="text-center text-red-500 font-bold">
          No tienes autorización para ver esta sección.
        </p>
      </div>
    );
  }

  /* Filtro de nombre + orden */
  const filtered = userCalls.filter(
    (r) =>
      r.user.toLowerCase().includes(searchValue.toLowerCase()) ||
      r.type.toLowerCase().includes(searchValue.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortStatus.direction === "asc" ? 1 : -1;
    if (sortStatus.columnAccessor === "user") {
      return dir * a.user.localeCompare(b.user);
    } else if (sortStatus.columnAccessor === "cost") {
      return dir * (a.cost - b.cost);
    }
    return dir * (a.count - b.count);
  });

  return (
    <div>
      {/* ------------- FILTROS ------------- */}
      <div className="grid md:grid-cols-4 grid-cols-1 gap-4 mb-6 text-black items-end">
        <TextInput
          type="date"
          label="Desde"
          value={sentAtGte || ""}
          onChange={(e) => setSentAtGte(e.target.value || null)}
        />
        <TextInput
          type="date"
          label="Hasta"
          value={sentAtLte || ""}
          onChange={(e) => setSentAtLte(e.target.value || null)}
        />

        {/* BOTÓN BUSCAR: dispara la consulta */}
        <Button
          onClick={fetchDashboardData}
          variant="filled"
          leftSection={<RiSearchLine />}
          disabled={pushLoading || canvasLoading || executionLoading}
        >
          Buscar
        </Button>

        {/* Opcional: refresco “rápido” ignorando filtros */}
        <Button
          onClick={() => {
            setSentAtGte(getMonthStart());
            setSentAtLte(getMonthEnd());
            fetchDashboardData();
          }}
          variant="filled"
          leftSection={<RiRefreshLine />}
          disabled={pushLoading || canvasLoading || executionLoading}
        >
          Reiniciar
        </Button>
      </div>

      {/* ------------- ERRORES ------------- */}
      {error && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Notification>
      )}

      {pushError && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setPushError(null)}
          withCloseButton
        >
          {pushError}
        </Notification>
      )}

      {canvasError && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setCanvasError(null)}
          withCloseButton
        >
          {canvasError}
        </Notification>
      )}

      {executionError && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setExecutionError(null)}
          withCloseButton
        >
          {executionError}
        </Notification>
      )}

      {webhookError && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setWebhookError(null)}
          withCloseButton
        >
          {webhookError}
        </Notification>
      )}

      {/* ------------- TARJETAS ------------- */}
      <div className="mt-2">
        <div className="grid md:grid-cols-6 grid-cols-1 gap-6 mb-6">
          <div className="card bg-white shadow p-6 text-center">
            <h2 className="text-lg font-bold mb-2 text-black">Total</h2>
            {pushLoading || canvasLoading || executionLoading || webhookLoading ? (
              <div className="flex justify-center">
                <Loader size="md" />
              </div>
            ) : (
              <p className="text-4xl font-extrabold text-success">
                ${cost.toFixed(2)}
              </p>
            )}
          </div>
          <div className="card bg-white shadow p-6 text-center">
            <h2 className="text-lg font-bold mb-2 text-black">Registros</h2>
            {pushLoading || canvasLoading || executionLoading || webhookLoading ? (
              <div className="flex justify-center">
                <Loader size="md" />
              </div>
            ) : (
              <p className="text-4xl font-extrabold text-info">{totalCalls}</p>
            )}
          </div>
          <div className="card bg-white shadow p-6 text-center">
            <h2 className="text-lg font-bold mb-2 text-black">Push Enviados</h2>
            {pushLoading ? (
              <div className="flex justify-center">
                <Loader size="md" />
              </div>
            ) : pushError ? (
              <p className="text-sm text-red-500">Error al cargar</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-blue-600">
                  {pushStats?.summary?.total_logs || 0}
                </p>
                <p className="text-sm text-gray-600">
                  ${parseFloat(pushStats?.summary?.total_cost || 0).toFixed(2)}
                </p>
              </>
            )}
          </div>
          <div className="card bg-white shadow p-6 text-center">
            <h2 className="text-lg font-bold mb-2 text-black">
              In-Apps Enviados
            </h2>
            {canvasLoading ? (
              <div className="flex justify-center">
                <Loader size="md" />
              </div>
            ) : canvasError ? (
              <p className="text-sm text-red-500">Error al cargar</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-600">
                  {canvasStats?.summary?.total_logs || 0}
                </p>
                <p className="text-sm text-gray-600">
                  $
                  {parseFloat(canvasStats?.summary?.total_cost || 0).toFixed(2)}
                </p>
              </>
            )}
          </div>
          <div className="card bg-white shadow p-6 text-center">
            <h2 className="text-lg font-bold mb-2 text-black">
              Reportes Enviados
            </h2>
            {executionLoading ? (
              <div className="flex justify-center">
                <Loader size="md" />
              </div>
            ) : executionError ? (
              <p className="text-sm text-red-500">Error al cargar</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-green-600">
                  {executionStats?.summary?.total_logs || 0}
                </p>
                <p className="text-sm text-gray-600">
                  $
                  {parseFloat(executionStats?.summary?.total_cost || 0).toFixed(
                    2
                  )}
                </p>
              </>
            )}
          </div>
          <div className="card bg-white shadow p-6 text-center">
            <h2 className="text-lg font-bold mb-2 text-black">
              Webhooks
            </h2>
            {webhookLoading ? (
              <div className="flex justify-center">
                <Loader size="md" />
              </div>
            ) : webhookError ? (
              <p className="text-sm text-red-500">Error al cargar</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-orange-600">
                  {webhookStats?.summary?.total_logs || 0}
                </p>
                <p className="text-sm text-gray-600">
                  $
                  {parseFloat(webhookStats?.summary?.total_cost || 0).toFixed(
                    2
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------- TABLA ------------- */}
      <div className="card bg-white shadow-xl p-6 text-black">
        <h2 className="text-lg text-black font-bold mb-4 text-center">
          Notificaciones por Usuario
        </h2>

        {pushLoading || canvasLoading || executionLoading || webhookLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-center">
              <Loader size="lg" />
              <p className="mt-2 text-gray-600">
                Cargando datos de usuarios...
              </p>
            </div>
          </div>
        ) : userCalls.length ? (
          <>
            <TextInput
              placeholder="Filtrar por usuario o tipo..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
              className="mb-4 text-black"
            />

            {/* Vista de escritorio - Tabla */}
            <div className="hidden md:block overflow-x-auto rounded-md">
              <table className="table w-full">
                <thead className="bg-primary text-white text-md uppercase font-bold">
                  <tr>
                    <th
                      className="cursor-pointer hover:bg-primary-focus"
                      onClick={() =>
                        setSortStatus({
                          columnAccessor: "user",
                          direction:
                            sortStatus.columnAccessor === "user" &&
                            sortStatus.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      Usuario{" "}
                      {sortStatus.columnAccessor === "user" &&
                        (sortStatus.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="cursor-pointer hover:bg-primary-focus"
                      onClick={() =>
                        setSortStatus({
                          columnAccessor: "type",
                          direction:
                            sortStatus.columnAccessor === "type" &&
                            sortStatus.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      Tipo{" "}
                      {sortStatus.columnAccessor === "type" &&
                        (sortStatus.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="cursor-pointer hover:bg-primary-focus"
                      onClick={() =>
                        setSortStatus({
                          columnAccessor: "count",
                          direction:
                            sortStatus.columnAccessor === "count" &&
                            sortStatus.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      Cantidad{" "}
                      {sortStatus.columnAccessor === "count" &&
                        (sortStatus.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="cursor-pointer hover:bg-primary-focus"
                      onClick={() =>
                        setSortStatus({
                          columnAccessor: "cost",
                          direction:
                            sortStatus.columnAccessor === "cost" &&
                            sortStatus.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      Costo{" "}
                      {sortStatus.columnAccessor === "cost" &&
                        (sortStatus.direction === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white text-black">
                  {sorted.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="uppercase font-bold">{record.user}</td>
                      <td>
                        <span
                          className={`badge ${
                            record.type === "PUSH"
                              ? "badge-primary"
                              : record.type === "CANVAS"
                              ? "badge-secondary"
                              : record.type === "WEBHOOK"
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="font-semibold">{record.count}</td>
                      <td className="font-bold text-green-600">
                        ${record.cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="md:hidden block space-y-4">
              {sorted.map((record, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="mb-1 font-semibold text-gray-600">
                        Usuario:
                      </div>
                      <div className="uppercase font-bold text-lg">
                        {record.user}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        record.type === "PUSH"
                          ? "badge-primary"
                          : record.type === "CANVAS"
                          ? "badge-secondary"
                          : record.type === "WEBHOOK"
                          ? "badge-warning"
                          : "badge-success"
                      }`}
                    >
                      {record.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="mb-1 font-semibold text-gray-600">
                        Cantidad:
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {record.count}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 font-semibold text-gray-600">
                        Costo:
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        ${record.cost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {record.email && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Email: {record.email}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center">No hay datos disponibles.</p>
        )}
      </div>
    </div>
  );
}
