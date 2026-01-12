"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    TextInput,
    Button,
    Loader,
    Notification,
    Pagination,
    Accordion,
} from "@mantine/core";
import {
    RiSearchLine,
    RiRefreshLine,
    RiCloseCircleLine,
    RiDownloadCloudLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import {
    listVentasHistoricas,
    downloadVentasHistoricas,
} from "@/tada/services/ventasHistoricasApi";

const PERMISSION_PATH = "/dashboard/sales/data-historica";

export default function DataHistoricaPage() {
    const { accessToken, user } = useAuth();

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useEffect(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user]);

    /* ------------------- FILTROS ------------------- */
    const getMonthStart = () =>
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .slice(0, 10);

    const getMonthEnd = () =>
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            .toISOString()
            .slice(0, 10);

    const [startDate, setStartDate] = useState(getMonthStart());
    const [endDate, setEndDate] = useState(getMonthEnd());
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: getMonthStart(),
        endDate: getMonthEnd(),
    });

    /* ------------------- TABLA ------------------- */
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [downloading, setDownloading] = useState(false);

    /* =========================================================
       Traer Ventas Históricas
    ========================================================= */
    const fetchVentas = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await listVentasHistoricas(
                accessToken,
                page,
                appliedFilters.startDate,
                appliedFilters.endDate,
                null,
                null,
                25
            );
            const results = data.results || [];
            setVentas(results);

            const itemsPerPage = 25;
            const count = data.count || 0;
            setTotalRecords(count);
            setTotalPages(Math.ceil(count / itemsPerPage));

            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar el historial de ventas");
        } finally {
            setLoading(false);
        }
    }, [accessToken, page, appliedFilters]);

    useEffect(() => {
        fetchVentas();
    }, [fetchVentas]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({
                startDate: startDate,
                endDate: endDate,
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setStartDate(getMonthStart());
            setEndDate(getMonthEnd());
            setAppliedFilters({
                startDate: getMonthStart(),
                endDate: getMonthEnd(),
            });
            setPage(1);
        } finally {
            setFiltering(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadVentasHistoricas(
                accessToken,
                appliedFilters.startDate,
                appliedFilters.endDate,
                null,
                null
            );
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al descargar el historial de ventas");
        } finally {
            setDownloading(false);
        }
    };

    /* =========================================================
       Render
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
        <div className="text-black h-full flex flex-col">
            {error && (
                <Notification color="red" className="mb-4" onClose={() => setError(null)}>
                    {error}
                </Notification>
            )}

            {/* ---------------- FILTROS ---------------- */}
            <div className="mb-4 flex-shrink-0">
                {/* Botón de descarga siempre visible */}
                <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                        onClick={handleDownload}
                        variant="filled"
                        color="teal"
                        leftSection={<RiDownloadCloudLine />}
                        loading={downloading}
                        className="flex-1 md:flex-none"
                    >
                        Descargar Excel
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
                                            fetchVentas();
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
                </div>
            </div>

            {/* ---------------- TABLA ---------------- */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="hidden md:block flex-1 overflow-auto rounded-md">
                    <table className="table w-full">
                        <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th>POC</th>
                                <th>Producto</th>
                                <th>Período</th>
                                <th>Hectolitros</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-black">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">
                                        <Loader size="sm" color="blue" />
                                    </td>
                                </tr>
                            ) : ventas.length ? (
                                ventas.map((venta, index) => (
                                    <tr key={`${venta.id}-${index}`} className="hover:bg-gray-100 uppercase">
                                        <td className="font-semibold">{venta.poc_name}</td>
                                        <td>{venta.name_homologated && venta.name_homologated !== "NONE" ? venta.name_homologated : venta.name}</td>
                                        <td>{venta.year_month}</td>
                                        <td className="font-bold">{venta.hectolitros?.toFixed(4) || "0.0000"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">
                                        No se encontraron registros de ventas.
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
                    ) : ventas.length ? (
                        ventas.map((venta, index) => (
                            <div
                                key={`${venta.id}-${index}`}
                                className="border border-gray-200 rounded-lg p-4 bg-white shadow-md uppercase"
                            >
                                <div className="mb-1 font-semibold">POC:</div>
                                <div className="mb-2 font-bold">{venta.poc_name}</div>

                                <div className="mb-1 font-semibold">Producto:</div>
                                <div className="mb-2">{venta.name_homologated && venta.name_homologated !== "NONE" ? venta.name_homologated : venta.name}</div>

                                <div className="mb-1 font-semibold">Período:</div>
                                <div className="mb-2">{venta.year_month}</div>

                                <div className="mb-1 font-semibold">Hectolitros:</div>
                                <div className="font-bold">{venta.hectolitros?.toFixed(4) || "0.0000"}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">No se encontraron registros de ventas.</div>
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
        </div>
    );
}
