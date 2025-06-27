"use client";

import { useEffect, useState, useCallback } from "react";
import { listLogsReport, getPrice } from "@/tada/services/pushApi";
import { TextInput, Loader, Notification, Button } from "@mantine/core";
import { RiRefreshLine, RiSearchLine } from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import Instructions from "../../tada/components/Instructions";

const PERMISSION_PATH = "/";

export default function DashboardHome() {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCalls, setTotalCalls] = useState(0);
  const [cost, setCost] = useState(0);
  const [userCalls, setUserCalls] = useState([]);
  const [authorized, setAuthorized] = useState(null);

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

  /* ------------------------- FETCH PRINCIPAL ---------------------- */
  // 1. Memoizamos la función para no recrearla en cada render
  const fetchDashboardData = useCallback(async () => {
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

      const { value: price } = await getPrice(accessToken);

      /* Totales y agrupaciones */
      const total = data.length;
      setTotalCalls(total);
      setCost(total * price);

      const counts = data.reduce((acc, log) => {
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
      <div className="p-8 bg-white rounded-md shadow-lg">
        <Instructions />
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
          <div className="mt-2">
            <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-6">
              <div className="card bg-white shadow p-6 text-center">
                <h2 className="text-lg font-bold mb-2 text-black">
                  Costo Mensual
                </h2>
                <p className="text-4xl font-extrabold text-success">
                  ${cost.toFixed(2)}
                </p>
              </div>
              <div className="card bg-white shadow p-6 text-center">
                <h2 className="text-lg font-bold mb-2 text-black">
                  Total de Push Mensuales
                </h2>
                <p className="text-4xl font-extrabold text-info">
                  {totalCalls}
                </p>
              </div>
            </div>
          </div>

          {/* ------------- TABLA ------------- */}
          <div className="card bg-white shadow-xl p-6 text-black">
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
