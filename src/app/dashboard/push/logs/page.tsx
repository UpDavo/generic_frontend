"use client";

import { useEffect, useState } from "react";
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
import { RiSearchLine, RiCloseCircleLine } from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";

interface UserChartItem {
  first_name: string;
  count: number;
}

interface UserChartType {
  type: string;
  count: number;
}

export default function LogPage() {
  const { accessToken, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para la búsqueda por fecha y usuarios
  const [sentAtGte, setSentAtGte] = useState<string | null>(null);
  const [sentAtLte, setSentAtLte] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState([]); // Lista de usuarios disponibles para el filtro

  // Datos de los gráficos
  const [userChartData, setUserChartData] = useState<UserChartItem[]>([]);
  const [notificationTypeChartData, setNotificationTypeChartData] = useState<
    UserChartType[]
  >([]);
  const [showCharts, setShowCharts] = useState(false);

  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === "/push/logs");

    if (hasPermission) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, router]);

  // Cargar lista de usuarios al montar el componente
  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken]);

  // Actualizar la tabla cuando cambian los filtros o la página
  useEffect(() => {
    if (accessToken) {
      fetchLogs();
    }
  }, [accessToken, page, sentAtGte, sentAtLte, selectedUsers]);

  // Actualizar los gráficos cuando hay filtros activos
  useEffect(() => {
    if (accessToken && (sentAtGte || sentAtLte || selectedUsers.length > 0)) {
      fetchLogsReport();
    } else {
      setUserChartData([]);
      setNotificationTypeChartData([]);
      setShowCharts(false);
    }
  }, [accessToken, sentAtGte, sentAtLte, selectedUsers]);

  // Obtiene la lista de usuarios disponibles para el filtro
  const fetchUsers = async () => {
    try {
      const data = await listUsers(accessToken);
      const formattedUsers = data.map((user: any) => ({
        value: user.email,
        label: `${user.first_name} ${user.last_name}`,
      }));
      setUsers(formattedUsers);
    } catch (err) {
      console.log(err);
    }
  };

  // Obtiene los logs paginados para la tabla
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await listLogs(
        accessToken,
        page,
        null,
        sentAtGte,
        sentAtLte,
        selectedUsers
      );
      setLogs(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los logs");
    } finally {
      setLoading(false);
    }
  };

  // Obtiene todos los logs (sin paginación) para los gráficos
  const fetchLogsReport = async () => {
    try {
      const data = await listLogsReport(
        accessToken,
        null,
        sentAtGte,
        sentAtLte,
        selectedUsers
      );
      // Contar logs por usuario
      const userCounts = data.reduce(
        (acc: any, log: { user: { first_name: string } }) => {
          acc[log.user.first_name] = (acc[log.user.first_name] || 0) + 1;
          return acc;
        },
        {}
      );

      const userChartDataFormatted = Object.keys(userCounts).map(
        (first_name) => ({
          first_name,
          count: userCounts[first_name],
        })
      );
      setUserChartData(userChartDataFormatted);

      // Contar logs por tipo de notificación
      const notificationCounts = data.reduce(
        (acc: any, log: { notification_type: string }) => {
          acc[log.notification_type] = (acc[log.notification_type] || 0) + 1;
          return acc;
        },
        {}
      );

      const notificationTypeChartDataFormatted = Object.keys(
        notificationCounts
      ).map((type) => ({
        type,
        count: notificationCounts[type],
      }));

      setNotificationTypeChartData(notificationTypeChartDataFormatted);
      setShowCharts(true);
    } catch (err) {
      console.log(err);
      setUserChartData([]);
      setNotificationTypeChartData([]);
      setShowCharts(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSentAtGte(null);
    setSentAtLte(null);
    setSelectedUsers([]);
    setShowCharts(false);
    setPage(1);
  };

  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col justify-center items-center mt-64">
        <h1 className="text-3xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="mt-2 text-gray-600">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      {/* Filtros de búsqueda */}
      <div className="grid md:grid-cols-4 grid-cols-1 align-bottom items-end gap-2 mx-2 mb-4">
        <TextInput
          type="date"
          label="Desde"
          value={sentAtGte || ""}
          onChange={(e) => {
            setSentAtGte(e.target.value || null);
            setPage(1);
          }}
          leftSection={<RiSearchLine />}
        />
        <TextInput
          type="date"
          label="Hasta"
          value={sentAtLte || ""}
          onChange={(e) => {
            setSentAtLte(e.target.value || null);
            setPage(1);
          }}
          leftSection={<RiSearchLine />}
        />
        <MultiSelect
          data={users}
          label="Filtrar por usuarios"
          placeholder="Selecciona usuarios"
          value={selectedUsers}
          onChange={setSelectedUsers}
        />
        <Button
          onClick={clearFilters}
          variant="outline"
          leftSection={<RiCloseCircleLine />}
          className="btn btn-info text-white hover:text-white btn-sm mb-1"
        >
          Limpiar Filtros
        </Button>
      </div>

      {/* Gráficos solo si hay filtros aplicados */}
      {showCharts && (
        <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-4">
          <div className="card bg-base-100 shadow-xl p-4">
            <h2 className="text-lg font-bold text-center mb-4">
              Reportes por Usuario
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userChartData}>
                <XAxis dataKey="first_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card bg-base-100 shadow-xl p-4">
            <h2 className="text-lg font-bold text-center mb-4">
              Reportes por Tipo de Notificación
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notificationTypeChartData}>
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#e67e22" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla de logs con paginación */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Vista de tabla solo para pantallas medianas en adelante */}
          <div className="overflow-x-auto rounded-md">
            <table className="table w-full hidden md:table">
              <thead className="bg-info text-white text-md uppercase font-bold">
                <tr className="text-white">
                  <th>Enviado por</th>
                  <th>Enviado a</th>
                  <th>Tipo</th>
                  <th>Mensaje</th>
                  <th>Fecha de Envío</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <Loader size="sm" color="blue" />
                      <p className="mt-2 text-gray-500">Cargando...</p>
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log: any) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-200 hover:border-slate-200 "
                    >
                      <td className="uppercase font-bold">
                        {log.user.first_name}
                      </td>
                      <td className="uppercase font-bold">{log.email}</td>
                      <td>
                        <div className="badge uppercase">
                          {log.notification_type}
                        </div>
                      </td>
                      <td>{log.message}</td>
                      <td>{new Date(log.sent_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No se encontraron logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Vista móvil (pantallas pequeñas) */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <div className="flex flex-col items-center py-4">
                  <Loader size="sm" color="blue" />
                  <p className="mt-2 text-gray-500">Cargando...</p>
                </div>
              ) : logs.length > 0 ? (
                logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 bg-white shadow-md "
                  >
                    <div className="mb-2">
                      <span className="font-semibold">Enviado por: </span>
                      <span className="uppercase font-bold">
                        {log.user.first_name}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Enviado a: </span>
                      <span className="uppercase font-bold">{log.email}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Tipo: </span>
                      <span className="badge uppercase">
                        {log.notification_type}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Mensaje: </span>
                      <span>{log.message}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Fecha de Envío: </span>
                      <span>{new Date(log.sent_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">No se encontraron logs.</div>
              )}
            </div>
          </div>
          {/* Paginación */}
          <Pagination
            value={page}
            onChange={(newPage) => setPage(newPage)}
            total={totalPages}
            className="mt-6"
          />
        </div>
      </div>
    </div>
  );
}
