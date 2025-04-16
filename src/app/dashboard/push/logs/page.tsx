"use client";

import { useEffect, useState, useCallback } from "react";
import { listLogs, listLogsReport } from "@/services/pushApi";
import { listUsers } from "@/services/userApi";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  Notification,
  Pagination,
  Loader,
  TextInput,
  Button,
  MultiSelect,
} from "@mantine/core";
import { RiSearchLine, RiCloseCircleLine, RiRefreshLine } from "react-icons/ri";
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
import { Unauthorized } from "@/components/Unauthorized";
import NotificationTD from "@/components/NotificationTD";
import { getColor } from "@/config/genericVariables";

/* ------------------- TIPOS AUXILIARES ------------------- */
interface UserChartItem {
  first_name: string;
  count: number;
}
interface UserChartType {
  type: string;
  count: number;
  fill: string;
}

/* =================== COMPONENTE =================== */
export default function LogPage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  /* ------------------- AUTORIZACIÓN ------------------- */
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  useEffect(() => {
    const ok =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === "/push/logs");
    setAuthorized(!!ok);
  }, [user]);

  /* ------------------- FILTROS (inputs) ------------------- */
  const [sentAtGte, setSentAtGte] = useState<string | null>(null);
  const [sentAtLte, setSentAtLte] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  /* ------------------- FILTROS APLICADOS ------------------- */
  const [appliedFilters, setAppliedFilters] = useState<{
    gte: string | null;
    lte: string | null;
    users: string[];
  }>({ gte: null, lte: null, users: [] });

  /* ------------------- TABLA ------------------- */
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ------------------- GRÁFICOS ------------------- */
  const [userChartData, setUserChartData] = useState<UserChartItem[]>([]);
  const [notificationTypeChartData, setNotificationTypeChartData] = useState<
    UserChartType[]
  >([]);
  const [showCharts, setShowCharts] = useState(false);

  /* =========================================================
     1. Carga inicial de usuarios
  ========================================================= */
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const data = await listUsers(accessToken);
        setUsers(
          data.map((u: any) => ({
            value: u.email,
            label: `${u.first_name} ${u.last_name}`,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, [accessToken]);

  /* =========================================================
     2. Traer LOGS cada vez que cambian page o appliedFilters
  ========================================================= */
  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const { results, count } = await listLogs(
        accessToken,
        page,
        null,
        appliedFilters.gte,
        appliedFilters.lte,
        appliedFilters.users
      );
      setLogs(results);
      setTotalPages(Math.ceil(count / 10));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los logs");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, appliedFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* =========================================================
     3. Traer datos para GRÁFICOS cuando cambian appliedFilters
  ========================================================= */
  const fetchLogsReport = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await listLogsReport(
        accessToken,
        null,
        appliedFilters.gte,
        appliedFilters.lte,
        appliedFilters.users
      ) as any[];

      /* -- Por usuario -- */
      const userCounts = data.reduce<Record<string, number>>((acc, log) => {
        const name = log.user.first_name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      setUserChartData(
        Object.entries(userCounts)
          .map(([first_name, count]) => ({ first_name, count }))
          .sort((a, b) => b.count - a.count)
      );

      /* -- Por tipo -- */
      const notifCounts = data.reduce<Record<string, number>>((acc, log) => {
        acc[log.notification_type] = (acc[log.notification_type] || 0) + 1;
        return acc;
      }, {});
      setNotificationTypeChartData(
        Object.entries(notifCounts)
          .map(([type, count]) => ({
            type,
            count,
            fill: getColor(type),
          }))
          .sort((a, b) => b.count - a.count)
      );

      setShowCharts(true);
    } catch (err) {
      console.error(err);
      setUserChartData([]);
      setNotificationTypeChartData([]);
      setShowCharts(false);
    }
  }, [accessToken, appliedFilters]);

  useEffect(() => {
    /* Solo si hay algún filtro aplicado */
    if (
      appliedFilters.gte ||
      appliedFilters.lte ||
      appliedFilters.users.length
    ) {
      fetchLogsReport();
    } else {
      setShowCharts(false);
      setUserChartData([]);
      setNotificationTypeChartData([]);
    }
  }, [fetchLogsReport]);

  /* =========================================================
     4. Handlers
  ========================================================= */
  const applyFilters = () => {
    setAppliedFilters({
      gte: sentAtGte,
      lte: sentAtLte,
      users: selectedUsers,
    });
    setPage(1); // reset paginación
  };

  const clearFilters = () => {
    setSentAtGte(null);
    setSentAtLte(null);
    setSelectedUsers([]);
    setAppliedFilters({ gte: null, lte: null, users: [] });
    setPage(1);
  };

  /* =========================================================
     5. Render
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
      <div className="grid md:grid-cols-5 grid-cols-1 gap-2 mb-4 mx-2 items-end">
        <TextInput
          type="date"
          label="Desde"
          value={sentAtGte || ""}
          onChange={(e) => setSentAtGte(e.target.value || null)}
          leftSection={<RiSearchLine />}
        />
        <TextInput
          type="date"
          label="Hasta"
          value={sentAtLte || ""}
          onChange={(e) => setSentAtLte(e.target.value || null)}
          leftSection={<RiSearchLine />}
        />
        <MultiSelect
          data={users}
          searchable
          label="Usuarios"
          placeholder="Selecciona usuarios"
          value={selectedUsers}
          onChange={setSelectedUsers}
        />
        <Button
          onClick={applyFilters}
          variant="filled"
          leftSection={<RiSearchLine />}
          disabled={loading}
        >
          Buscar
        </Button>
        <Button
          onClick={clearFilters}
          variant="outline"
          leftSection={<RiCloseCircleLine />}
          disabled={loading}
        >
          Limpiar
        </Button>
      </div>

      {/* ---------------- GRÁFICOS ---------------- */}
      {showCharts && (
        <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-4">
          <div className="card bg-base-100 shadow-xl p-4">
            <h2 className="text-lg font-bold text-center mb-4">
              Push por Usuario
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userChartData}>
                <XAxis dataKey="first_name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    color: "black",
                    border: "1px solid #ddd",
                  }}
                />
                <Bar dataKey="count" fill="#5A57EE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card bg-base-100 shadow-xl p-4">
            <h2 className="text-lg font-bold text-center mb-4">
              Tipos de Push
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notificationTypeChartData}>
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
                  {notificationTypeChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ---------------- TABLA + PAGINACIÓN ---------------- */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Tabla (desktop) */}
          <div className="overflow-x-auto rounded-md hidden md:block">
            <table className="table w-full">
              <thead className="bg-info text-white text-md uppercase font-bold">
                <tr>
                  <th>Enviado por</th>
                  <th>Enviado a</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <Loader size="sm" color="blue" />
                    </td>
                  </tr>
                ) : logs.length ? (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-200">
                      <td className="uppercase font-bold">
                        {log.user.first_name}
                      </td>
                      <td className="lowercase italic">{log.email}</td>
                      <NotificationTD type={log.notification_type} td className="mt-2"/>
                      <td>{log.title}</td>
                      <td>{new Date(log.sent_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No se encontraron logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="flex flex-col items-center py-4">
                <Loader size="sm" color="blue" />
              </div>
            ) : logs.length ? (
              logs.map((log: any) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 bg-white shadow-md"
                >
                  <div className="mb-1 font-semibold">Enviado por:</div>
                  <div className="uppercase mb-2">{log.user.first_name}</div>

                  <div className="mb-1 font-semibold">Enviado a:</div>
                  <div className="lowercase mb-2">{log.email}</div>

                  <NotificationTD type={log.notification_type} td={false} />

                  <div className="mt-2 font-semibold">Título:</div>
                  <div>{log.title}</div>

                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(log.sent_at).toLocaleString()}
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
      </div>
    </div>
  );
}
