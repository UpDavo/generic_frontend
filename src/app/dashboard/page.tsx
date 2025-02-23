"use client";

import { useEffect, useState } from "react";
import { listLogsReport, getPrice } from "@/services/pushApi";
import { TextInput, Loader, Notification } from "@mantine/core";
import { RiSearchLine } from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  const [sentAtGte, setSentAtGte] = useState<string | null>(null);
  const [sentAtLte, setSentAtLte] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [userCalls, setUserCalls] = useState([]);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === "/");

    if (hasPermission) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [sentAtGte, sentAtLte]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLogsReport(
        accessToken,
        null,
        sentAtGte,
        sentAtLte,
        []
      );

      const prices = await getPrice(accessToken);

      // Calcular total de llamadas
      const total = data.length;
      setTotalCalls(total);

      // Calcular costo (Ejemplo: $0.05 por llamada)
      const calculatedCost = total * prices.value;
      setCost(calculatedCost);

      // Calcular llamadas por usuario
      const userCounts = data.reduce((acc, log) => {
        const userName = log.user.first_name;
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {});

      const formattedUserCalls = Object.keys(userCounts).map((user) => ({
        user,
        count: userCounts[user],
      }));

      setUserCalls(formattedUserCalls);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
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
      <div className="flex flex-col justify-center items-center md:mt-64 mt-20">
        <h1 className="text-3xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="mt-2 text-gray-600">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros de fecha */}
      <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mb-6">
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
      </div>

      {/* Errores */}
      {error && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setError(null)} // Permite cerrar la notificación
          withCloseButton
        >
          {error}
        </Notification>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          {/* Tarjetas de información */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-6">
            {/* Costo Total */}
            <div className="card bg-base-100 shadow-xl p-6 text-center">
              <h2 className="text-lg font-bold mb-2">Costo General</h2>
              <p className="text-4xl font-extrabold text-green-500">
                ${cost.toFixed(2)}
              </p>
            </div>

            {/* Llamadas Generales */}
            <div className="card bg-base-100 shadow-xl p-6 text-center">
              <h2 className="text-lg font-bold mb-2">Llamadas Generales</h2>
              <p className="text-4xl font-extrabold text-blue-500">
                {totalCalls}
              </p>
            </div>
          </div>

          {/* Gráfico de llamadas por usuario */}
          <div className="card bg-base-100 shadow-xl p-6 col-span-3">
            <h2 className="text-lg font-bold text-center mb-4">
              Push por Usuario
            </h2>
            {userCalls.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userCalls}>
                  <XAxis dataKey="user" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3498db" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">
                No hay datos disponibles.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
