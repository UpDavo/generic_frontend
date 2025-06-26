"use client";

import { useEffect, useState, useCallback } from "react";
import { listLogsReport, getPrice } from "@/services/pushApi";
import { TextInput, Loader, Notification, Button } from "@mantine/core";
import { RiRefreshLine, RiSearchLine } from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { DataTable, DataTableSortStatus } from "mantine-datatable";

export default function DashboardHome() {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCalls, setTotalCalls] = useState(0);
  const [cost, setCost] = useState(0);
  const [userCalls, setUserCalls] = useState<any[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  /* Filtro en la tabla */
  const [searchValue, setSearchValue] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
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
  const [sentAtGte, setSentAtGte] = useState<any>(getMonthStart());
  const [sentAtLte, setSentAtLte] = useState<any>(getMonthEnd());

  /* ------------------------- AUTORIZACIÓN ------------------------- */
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === "/");
    setAuthorized(!!hasPermission);
  }, [user]);

  /* ------------------------- FETCH PRINCIPAL ---------------------- */
  // 1. Memoizamos la función para no recrearla en cada render
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data: any[] = await listLogsReport(
        accessToken,
        null,
        sentAtGte,
        sentAtLte,
        []
      );

      const { value: price } = await getPrice(accessToken);

      /* Totales y agrupaciones */
      const total = data.length;
      setTotalCalls(total);
      setCost(total * price);

      const counts = data.reduce<Record<string, number>>((acc, log) => {
        const name = log.user.first_name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      setUserCalls(
        Object.entries(counts).map(([user, count]) => ({ user, count }))
      );
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, sentAtGte, sentAtLte]);

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
      <div className="p-6 bg-white shadow-md rounded-xl text-black">
        <h1 className="text-2xl font-bold text-start mb-4">
          📢 Centro de Notificaciones - POCs
        </h1>
        <p className="text-gray-700 mb-6">
          ✨ Aquí encontrarás los mensajes que puedes enviar a los clientes en
          diferentes escenarios de su pedido. Es importante seguir los tiempos
          establecidos para garantizar una comunicación efectiva y mejorar la
          experiencia del usuario.
        </p>

        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 1. Motorizado en camino 🏍️ (Opcional, decisión del POC)
            </h2>
            <p>
              ✅ Se puede enviar cuando el pedido ha sido recogido y está en
              ruta.
            </p>
            <p>
              ✅ Cada POC decide si lo envía, ya que conoce mejor a sus
              clientes.
            </p>
            <p className="text-gray-600 italic">
              &quot;🚀 ¡Tu pedido ya está en camino! 🍻✨ [Nombre], nuestro
              motorizado está en ruta llevando la magia de Tada hasta tu puerta.
              📦📍 Sigue su ubicación en la app y prepárate para
              recibirlo.&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 2. Motorizado llegó al punto de entrega 🏡 (Enviar si el
              cliente no responde en los primeros 5 minutos)
            </h2>
            <p>
              ✅ Si al llegar a la dirección el cliente no responde en los
              primeros 5 minutos, el POC debe enviar esta notificación.
            </p>
            <p className="text-gray-600 italic">
              &quot;📦 ¡Tu pedido ha llegado! 🏡🍻 [Nombre], la magia de Tada ya
              está en tu puerta. Nuestro motorizado te espera para entregarte tu
              pedido. ¡Nos vemos en un segundo!&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 3. Advertencia de cancelación por falta de respuesta 📞 (Enviar
              si han pasado 10 minutos y el cliente sigue sin responder)
            </h2>
            <p>
              ✅ Si pasan 5 minutos después del mensaje anterior (total 10 min
              desde la llegada) y el cliente aún no responde, el POC debe enviar
              esta notificación.
            </p>
            <p className="text-gray-600 italic">
              &quot;📦 ¡Tu cerveza está a punto de irse! 🍻✨ [Nombre],
              intentamos contactarte, pero no recibimos respuesta. 😔 Escríbenos
              antes de que el pedido sea cancelado.&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📌 4. Pedido cancelado por falta de respuesta ❌ (Enviar si han
              pasado 15 minutos y el cliente sigue sin responder)
            </h2>
            <p>
              ✅ Si pasan otros 5 minutos (total 15 min desde la llegada del
              motorizado) y el cliente sigue sin responder, el POC debe enviar
              esta notificación.
            </p>
            <p className="text-gray-600 italic">
              &quot;⚠️ Tu pedido ha sido cancelado 🍻❌ [Nombre], intentamos
              comunicarnos contigo, pero no tuvimos respuesta. 😔 Si tienes
              alguna novedad, escríbenos al 099 373 2628.&quot;
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">
              📍 Proceso Completo de Notificaciones y Tiempos
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>1️⃣ Motorizado en camino (Opcional, decisión del POC).</li>
              <li>
                2️⃣ Motorizado llegó → Si después de 5 min el cliente no
                responde, enviar notificación.
              </li>
              <li>
                3️⃣ Advertencia de cancelación → Si después de 10 min el cliente
                sigue sin responder, enviar notificación.
              </li>
              <li>
                4️⃣ Pedido cancelado → Si después de 15 min el cliente sigue sin
                responder, enviar notificación.
              </li>
            </ul>
            <p className="mt-2">
              ✅ Los POCs deben enviar manualmente cada notificación según los
              tiempos establecidos.
            </p>
            <p>
              ✅ El mensaje de &quot;Pedido en camino&quot; es opcional y queda
              a criterio del POC.
            </p>
          </div>
        </div>
      </div>
    ); // tu componente de no‑autorizado
  }

  /* Filtro de nombre + orden */
  const filtered = userCalls.filter((r) =>
    r.user.toLowerCase().includes(searchValue.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortStatus.direction === "asc" ? 1 : -1;
    return sortStatus.columnAccessor === "user"
      ? dir * a.user.localeCompare(b.user)
      : dir * (a.count - b.count);
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
          disabled={loading}
        >
          Buscar
        </Button>

        {/* Opcional: refresco “rápido” ignorando filtros */}
        <Button
          onClick={() => {
            setSentAtGte(null);
            setSentAtLte(null);
            fetchDashboardData();
          }}
          variant="light"
          leftSection={<RiRefreshLine />}
          disabled={loading}
        >
          Reset
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          {/* ------------- TARJETAS ------------- */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-6">
            <div className="card bg-gray-100 shadow-xl p-6 text-center">
              <h2 className="text-lg font-bold mb-2 text-black">
                Costo Mensual
              </h2>
              <p className="text-4xl font-extrabold text-success">
                ${cost.toFixed(2)}
              </p>
            </div>
            <div className="card bg-gray-100 shadow-xl p-6 text-center">
              <h2 className="text-lg font-bold mb-2 text-black">
                Total de Push Mensuales
              </h2>
              <p className="text-4xl font-extrabold text-info">{totalCalls}</p>
            </div>
          </div>

          {/* ------------- TABLA ------------- */}
          <div className="card bg-gray-100 shadow-xl p-6 text-black">
            <h2 className="text-lg font-bold mb-4 text-center">
              Pushs por Usuario
            </h2>

            {userCalls.length ? (
              <>
                <TextInput
                  placeholder="Filtrar por usuario..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.currentTarget.value)}
                  className="mb-4"
                />

                <DataTable
                  records={sorted}
                  columns={[
                    { accessor: "user", title: "Usuario", sortable: true },
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
                  noRecordsText="Sin registros"
                />
              </>
            ) : (
              <p className="text-center">No hay datos disponibles.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
