"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    TextInput,
    Button,
    Loader,
    Notification,
    NumberInput,
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
    getWeeklyHectolitresReport,
    downloadWeeklyHectolitresReport,
} from "@/tada/services/ventasHistoricasApi";

const PERMISSION_PATH = "/dashboard/sales/data-historica/hectolitros";

const DIAS_SEMANA = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const DIAS_NOMBRES = {
    lun: "Lunes",
    mar: "Martes",
    mie: "Miércoles",
    jue: "Jueves",
    vie: "Viernes",
    sab: "Sábado",
    dom: "Domingo",
};

export default function HectolitrosPage() {
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
    const currentYear = new Date().getFullYear();
    const [startYear, setStartYear] = useState(currentYear);
    const [endYear, setEndYear] = useState(currentYear);
    const [startWeek, setStartWeek] = useState(1);
    const [endWeek, setEndWeek] = useState(4);
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        startYear: currentYear,
        endYear: currentYear,
        startWeek: 1,
        endWeek: 4,
    });

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    /* =========================================================
       Traer Reporte
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await getWeeklyHectolitresReport(
                accessToken,
                appliedFilters.startYear,
                appliedFilters.endYear,
                appliedFilters.startWeek,
                appliedFilters.endWeek
            );
            setReportData(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar el reporte de hectolitros");
        } finally {
            setLoading(false);
        }
    }, [accessToken, appliedFilters]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({
                startYear: startYear,
                endYear: endYear,
                startWeek: startWeek,
                endWeek: endWeek,
            });
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            const currentYear = new Date().getFullYear();
            setStartYear(currentYear);
            setEndYear(currentYear);
            setStartWeek(1);
            setEndWeek(4);
            setAppliedFilters({
                startYear: currentYear,
                endYear: currentYear,
                startWeek: 1,
                endWeek: 4,
            });
        } finally {
            setFiltering(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadWeeklyHectolitresReport(
                accessToken,
                appliedFilters.startYear,
                appliedFilters.endYear,
                appliedFilters.startWeek,
                appliedFilters.endWeek
            );
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al descargar el reporte de hectolitros");
        } finally {
            setDownloading(false);
        }
    };

    /* =========================================================
       Obtener las semanas del reporte
    ========================================================= */
    const getWeekKeys = () => {
        if (!reportData) return [];
        return Object.keys(reportData).filter((key) => key.startsWith("w")).sort();
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
                                    <NumberInput
                                        label="Año Inicial"
                                        placeholder="Ej: 2026"
                                        value={startYear}
                                        onChange={setStartYear}
                                        min={2020}
                                        max={2100}
                                    />
                                    <NumberInput
                                        label="Año Final"
                                        placeholder="Ej: 2026"
                                        value={endYear}
                                        onChange={setEndYear}
                                        min={2020}
                                        max={2100}
                                    />
                                    <NumberInput
                                        label="Semana Inicial"
                                        placeholder="1-53"
                                        value={startWeek}
                                        onChange={setStartWeek}
                                        min={1}
                                        max={53}
                                    />
                                    <NumberInput
                                        label="Semana Final"
                                        placeholder="1-53"
                                        value={endWeek}
                                        onChange={setEndWeek}
                                        min={1}
                                        max={53}
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
                                        onClick={fetchReport}
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
                <div className="hidden md:grid md:grid-cols-6 grid-cols-1 gap-2 items-end">
                    <NumberInput
                        label="Año Inicial"
                        placeholder="Ej: 2026"
                        value={startYear}
                        onChange={setStartYear}
                        min={2020}
                        max={2100}
                    />
                    <NumberInput
                        label="Año Final"
                        placeholder="Ej: 2026"
                        value={endYear}
                        onChange={setEndYear}
                        min={2020}
                        max={2100}
                    />
                    <NumberInput
                        label="Semana Inicial"
                        placeholder="1-53"
                        value={startWeek}
                        onChange={setStartWeek}
                        min={1}
                        max={53}
                    />
                    <NumberInput
                        label="Semana Final"
                        placeholder="1-53"
                        value={endWeek}
                        onChange={setEndWeek}
                        min={1}
                        max={53}
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

            {/* ---------------- RESUMEN TOTAL ---------------- */}
            {reportData?.total && (
                <div className="mb-4 flex-shrink-0">
                    <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                        <div className="card bg-white shadow-md p-6 border-l-4 border-blue-500">
                            <div className="text-sm text-gray-500 uppercase mb-2">
                                Hectolitros Vendidos
                            </div>
                            <div className="text-4xl font-bold text-blue-600">
                                {reportData.total.ht_vendidos?.toFixed(2) || "0.00"}
                            </div>
                        </div>
                        <div className="card bg-white shadow-md p-6 border-l-4 border-green-500">
                            <div className="text-sm text-gray-500 uppercase mb-2">
                                Meta de Hectolitros
                            </div>
                            <div className="text-4xl font-bold text-green-600">
                                {reportData.total.ht_meta?.toFixed(2) || "0.00"}
                            </div>
                        </div>
                        <div className="card bg-white shadow-md p-6 border-l-4 border-purple-500">
                            <div className="text-sm text-gray-500 uppercase mb-2">
                                Cumplimiento
                            </div>
                            <div className="text-4xl font-bold text-purple-600">
                                {reportData.total.cumplimiento || "0%"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- TABLA ---------------- */}
            <div className="flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : reportData && getWeekKeys().length > 0 ? (
                    <>
                        {/* Vista Desktop - Tabla Única */}
                        <div className="hidden md:block flex-1 overflow-auto rounded-md">
                            <table className="table w-full">
                                <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                                    <tr>
                                        <th>Semana</th>
                                        <th>Día</th>
                                        <th>Fecha</th>
                                        <th>Hectolitros</th>
                                        <th>Meta</th>
                                        <th>Cumplimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-black">
                                    {getWeekKeys().map((weekKey) => {
                                        const weekData = reportData[weekKey];
                                        const weekNumber = weekKey.replace("w", "");
                                        
                                        return DIAS_SEMANA.map((dia, index) => {
                                            const diaData = weekData[dia];
                                            if (!diaData) return null;
                                            
                                            return (
                                                <tr key={`${weekKey}-${dia}`} className="hover:bg-gray-100">
                                                    {index === 0 ? (
                                                        <td 
                                                            rowSpan={DIAS_SEMANA.filter(d => weekData[d]).length} 
                                                            className="font-bold text-center bg-gray-50"
                                                        >
                                                            W{weekNumber}
                                                        </td>
                                                    ) : null}
                                                    <td className="font-bold uppercase">{DIAS_NOMBRES[dia]}</td>
                                                    <td>{diaData.fecha}</td>
                                                    <td className="font-semibold text-blue-600">
                                                        {diaData.ht?.toFixed(2) || "0.00"}
                                                    </td>
                                                    <td className="font-semibold text-green-600">
                                                        {diaData.ht_meta?.toFixed(2) || "0.00"}
                                                    </td>
                                                    <td className="font-bold text-purple-600">
                                                        {diaData.cumplimiento || "0%"}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </tbody>
                                {reportData?.total && (
                                    <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                                        <tr>
                                            <td colSpan={3} className="text-center uppercase">Total</td>
                                            <td className="text-blue-600">
                                                {reportData.total.ht_vendidos?.toFixed(2) || "0.00"}
                                            </td>
                                            <td className="text-green-600">
                                                {reportData.total.ht_meta?.toFixed(2) || "0.00"}
                                            </td>
                                            <td className="text-purple-600">
                                                {reportData.total.cumplimiento || "0%"}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Vista Móvil */}
                        <div className="md:hidden block flex-1 overflow-auto space-y-6">
                            {getWeekKeys().map((weekKey) => {
                                const weekData = reportData[weekKey];
                                return (
                                    <div key={weekKey}>
                                        <h3 className="text-xl font-bold mb-3 uppercase">
                                            Semana {weekKey.replace("w", "")}
                                        </h3>
                                        <div className="space-y-4">
                                            {DIAS_SEMANA.map((dia) => {
                                                const diaData = weekData[dia];
                                                if (!diaData) return null;
                                                return (
                                                    <div
                                                        key={dia}
                                                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                                                    >
                                                        <div className="mb-2 font-bold text-lg uppercase">
                                                            {DIAS_NOMBRES[dia]} - {diaData.fecha}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <div className="mb-1 font-semibold text-gray-600">
                                                                    Hectolitros:
                                                                </div>
                                                                <div className="text-xl font-bold text-blue-600">
                                                                    {diaData.ht?.toFixed(2) || "0.00"}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="mb-1 font-semibold text-gray-600">
                                                                    Meta:
                                                                </div>
                                                                <div className="text-xl font-bold text-green-600">
                                                                    {diaData.ht_meta?.toFixed(2) || "0.00"}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="mb-1 font-semibold text-gray-600">
                                                                Cumplimiento:
                                                            </div>
                                                            <div className="text-2xl font-bold text-purple-600">
                                                                {diaData.cumplimiento || "0%"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        No se encontraron datos para el rango seleccionado.
                    </div>
                )}
            </div>
        </div>
    );
}
