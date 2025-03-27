"use client";

import { useEffect, useState } from "react";
import { listLogsReport, getPrice } from "@/services/pushApi";
import { TextInput, Loader, Notification, Button } from "@mantine/core";
import { RiRefreshLine, RiSearchLine } from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Unauthorized } from "@/components/Unauthorized";

/* IMPORTAMOS EL COMPONENTE DE TABLA */
import { DataTable, DataTableSortStatus } from "mantine-datatable";

export default function DashboardHome() {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  const [sentAtGte, setSentAtGte] = useState<string | null>(null);
  const [sentAtLte, setSentAtLte] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);

  // Datos agrupados por usuario
  const [userCalls, setUserCalls] = useState<any[]>([]);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Estado para la búsqueda en la tabla
  const [searchValue, setSearchValue] = useState<string>("");

  // Estado para el manejo de la ordenación en la tabla
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "count", // Ordenamos por defecto por la columna 'count'
    direction: "desc", // De mayor a menor
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentAtGte, sentAtLte]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Obtenemos la respuesta paginada
      const data: any[] = await listLogsReport(
        accessToken,
        null,
        sentAtGte,
        sentAtLte,
        []
      );

      // 2) Obtenemos el precio
      const prices = await getPrice(accessToken);

      // 3) Calcular total de llamadas
      const total = data.length;
      setTotalCalls(total);

      // 4) Calcular costo
      const calculatedCost = total * prices.value;
      setCost(calculatedCost);

      // 5) Calcular llamadas por usuario (reduce)
      const userCounts = data.reduce<Record<string, number>>((acc, log) => {
        const userName = log.user.first_name;
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {});

      const formatted = Object.keys(userCounts).map((key) => ({
        user: key,
        count: userCounts[key],
      }));

      setUserCalls(formatted);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
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
      <div className="p-6 bg-white shadow-md rounded-xl text-black">
        <h1 className="text-2xl font-bold text-start mb-4">
          📢 Centro de Notificaciones
        </h1>
        <p className="text-gray-700 mb-6">
          ✨ Aquí encontrarás los mensajes automáticos que se enviarán a los
          clientes en diferentes escenarios de su pedido. Estas notificaciones
          ayudan a mejorar la comunicación y la experiencia del usuario.
        </p>

        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 1. Motorizado en camino 🏍️
            </h2>
            <p>
              ✅ Se enviará cuando el pedido se asigne y esté en ruta hacia el
              cliente.
            </p>
            <p className="text-gray-600 italic">
              &quot;🚀 ¡Tu pedido ya está en camino! 🍻✨ [Nombre], nuestro
              motorizado está en ruta llevando la magia de Tada hasta tu puerta.
              📦 📍 Sigue su ubicación en la app y prepárate para
              recibirlo.&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 2. Motorizado llegó al punto de entrega 🏡
            </h2>
            <p>
              ✅ Se enviará cuando el motorizado haya llegado a la dirección del
              cliente.
            </p>
            <p className="text-gray-600 italic">
              &quot;📦 ¡Tu pedido ha llegado! 🏡🍻 [Nombre], la magia de Tada ya
              está en tu puerta. Nuestro motorizado te espera para entregarte tu
              pedido. ¡Nos vemos en un segundo!&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 3. Pedido será cancelado por falta de respuesta 📞
            </h2>
            <p>
              ✅ Se enviará cuando el cliente no responda tras varios intentos
              de contacto.
            </p>
            <p className="text-gray-600 italic">
              &quot;📦 ¡Tu cerveza está a punto de irse! 🍻✨ [Nombre],
              intentamos contactarte, pero no recibimos respuesta. 😔 Escríbenos
              antes de que el pedido sea cancelado.&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 4. Pedido cancelado por falta de respuesta ❌
            </h2>
            <p>
              ✅ Se enviará cuando el pedido haya sido cancelado por no lograr
              contactar al cliente.
            </p>
            <p className="text-gray-600 italic">
              &quot;⚠️ Tu pedido ha sido cancelado 🍻❌ [Nombre], intentamos
              comunicarnos contigo, pero no tuvimos respuesta. 😔 Si tienes
              alguna novedad, escríbenos al 099 373 2628.&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📍 Consideraciones Importantes
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>
                ✅ Se debe copiar y pegar el correo del cliente, ya que solo
                funciona con el correo del cliente.
              </li>
              <li>
                ✅ Son notificaciones informativas para mejorar la comunicación
                con los clientes.
              </li>
              <li>
                ✅ En caso de dudas o problemas con las notificaciones, pueden
                contactar a soporte.
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Filtrado por nombre de usuario
  const filteredRecords = userCalls.filter((item) =>
    item.user.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Ordenamos los datos según el estado de sortStatus
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const { columnAccessor, direction } = sortStatus;

    // Ordenamiento simple: 'user' o 'count'
    if (columnAccessor === "user") {
      const comp = a.user.localeCompare(b.user);
      return direction === "asc" ? comp : -comp;
    } else if (columnAccessor === "count") {
      const comp = a.count - b.count;
      return direction === "asc" ? comp : -comp;
    }
    return 0;
  });

  return (
    <div>
      {/* Filtros de fecha */}
      <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mb-6 text-black items-end">
        <TextInput
          type="date"
          label="Desde"
          value={sentAtGte || ""}
          onChange={(e) => setSentAtGte(e.target.value || null)}
          // icon={<RiSearchLine />}
        />
        <TextInput
          type="date"
          label="Hasta"
          value={sentAtLte || ""}
          onChange={(e) => setSentAtLte(e.target.value || null)}
          // icon={<RiSearchLine />}
        />
        <Button
          onClick={refreshData}
          variant="filled"
          leftSection={<RiRefreshLine />}
          className="btn btn-primary btn-sm mb-1"
        >
          Refrescar
        </Button>
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
            <div className="card bg-gray-100 shadow-xl p-6 text-center">
              <h2 className="text-lg font-bold mb-2 text-black">
                Costo Mensual
              </h2>
              <p className="text-4xl font-extrabold text-success">
                ${cost.toFixed(2)}
              </p>
            </div>

            {/* Llamadas Generales */}
            <div className="card bg-gray-100 shadow-xl p-6 text-center">
              <h2 className="text-lg font-bold mb-2 text-black">
                Total de Push Mensuales
              </h2>
              <p className="text-4xl font-extrabold text-info">{totalCalls}</p>
            </div>
          </div>

          {/* Tabla de llamadas por usuario */}
          <div className="card bg-gray-100 shadow-xl p-6 col-span-3 text-black">
            <h2 className="text-lg font-bold mb-4 text-black text-center">
              Pushs por Usuario
            </h2>

            {userCalls.length > 0 ? (
              <>
                {/* Input para filtrar por usuario */}
                <TextInput
                  placeholder="Filtrar por nombre de usuario..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.currentTarget.value)}
                  // left={<RiSearchLine />}
                  className="mb-4"
                />

                {/* DataTable con ordenamiento y filtrado */}
                <DataTable
                  records={sortedRecords}
                  columns={[
                    {
                      accessor: "user",
                      title: "Usuario",
                      sortable: true,
                    },
                    {
                      accessor: "count",
                      title: "Pushs Enviados",
                      sortable: true,
                    },
                  ]}
                  sortStatus={sortStatus}
                  onSortStatusChange={setSortStatus}
                  highlightOnHover
                  verticalSpacing="sm"
                  noRecordsText="Total de Registros"
                  className="text-black"
                />
              </>
            ) : (
              <p className="text-center text-black">
                No hay datos disponibles.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
