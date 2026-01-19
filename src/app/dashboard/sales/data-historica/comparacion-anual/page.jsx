"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Button,
    Loader,
    Notification,
    NumberInput,
    Select,
    Accordion,
    Modal,
} from "@mantine/core";
import {
    RiSearchLine,
    RiCloseCircleLine,
    RiDownloadCloudLine,
    RiRefreshLine,
    RiBarChartBoxLine,
    RiEditLine,
} from "react-icons/ri";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/auth/hooks/useAuth";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ENV } from "@/config/env";

const PERMISSION_PATH = "/dashboard/sales/data-historica/comparacion-anual";

export default function ComparacionAnualPage() {
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
    const [startYear, setStartYear] = useState(2024);
    const [endYear, setEndYear] = useState(currentYear);
    const [startWeek, setStartWeek] = useState(1);
    const [endWeek, setEndWeek] = useState(4);
    const [reportType, setReportType] = useState("hectolitros");
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        startYear: 2024,
        endYear: currentYear,
        startWeek: 1,
        endWeek: 4,
        reportType: "hectolitros",
    });

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ------------------- DATOS MANUALES ------------------- */
    const [manualData, setManualData] = useState({});
    const [manualCityData, setManualCityData] = useState({});
    
    /* ------------------- MODALES ------------------- */
    const [modalYearOpen, setModalYearOpen] = useState(false);
    const [modalCityOpen, setModalCityOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedCityYear, setSelectedCityYear] = useState(null);
    const [tempValue, setTempValue] = useState("");

    /* =========================================================
       Traer Reporte
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const url = new URL(`${ENV.API_URL}/tada/hectolitres/yearly-comparison/`);
            url.searchParams.append("start_year", appliedFilters.startYear);
            url.searchParams.append("end_year", appliedFilters.endYear);
            url.searchParams.append("start_week", appliedFilters.startWeek);
            url.searchParams.append("end_week", appliedFilters.endWeek);
            url.searchParams.append("report_type", appliedFilters.reportType);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Error al obtener el reporte");
            }

            const data = await response.json();
            setReportData(data);
            setError(null);
        } catch (err) {
            setError(err.message || "Error al cargar el reporte");
            setReportData(null);
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
                startYear,
                endYear,
                startWeek,
                endWeek,
                reportType,
            });
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setStartYear(2024);
            setEndYear(currentYear);
            setStartWeek(1);
            setEndWeek(4);
            setReportType("hectolitros");
            setAppliedFilters({
                startYear: 2024,
                endYear: currentYear,
                startWeek: 1,
                endWeek: 4,
                reportType: "hectolitros",
            });
            setManualData({});
            setManualCityData({});
        } finally {
            setFiltering(false);
        }
    };

    const openYearModal = (year) => {
        setSelectedYear(year);
        setTempValue(manualData[year] ?? "");
        setModalYearOpen(true);
    };

    const saveYearValue = () => {
        if (tempValue !== null && tempValue !== "") {
            setManualData((prev) => ({
                ...prev,
                [selectedYear]: tempValue,
            }));
        }
        setModalYearOpen(false);
        setTempValue("");
        setSelectedYear(null);
    };

    const openCityModal = (city, year) => {
        setSelectedCity(city);
        setSelectedCityYear(year);
        const key = `${city}_${year}`;
        setTempValue(manualCityData[key] ?? "");
        setModalCityOpen(true);
    };

    const saveCityValue = () => {
        if (tempValue !== null && tempValue !== "") {
            const key = `${selectedCity}_${selectedCityYear}`;
            setManualCityData((prev) => ({
                ...prev,
                [key]: tempValue,
            }));
        }
        setModalCityOpen(false);
        setTempValue("");
        setSelectedCity(null);
        setSelectedCityYear(null);
    };

    const handleDownload = async () => {
        try {
            const url = new URL(`${ENV.API_URL}/tada/hectolitres/yearly-comparison/download/`);
            url.searchParams.append("start_year", appliedFilters.startYear);
            url.searchParams.append("end_year", appliedFilters.endYear);
            url.searchParams.append("start_week", appliedFilters.startWeek);
            url.searchParams.append("end_week", appliedFilters.endWeek);
            url.searchParams.append("report_type", appliedFilters.reportType);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Error al descargar el archivo");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `comparacion_anual_${appliedFilters.reportType}_${appliedFilters.startYear}_${appliedFilters.endYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (err) {
            setError(err.message || "Error al descargar el archivo");
        }
    };

    /* =========================================================
       Obtener años del reporte
    ========================================================= */
    const getYears = () => {
        if (!reportData?.totals) return [];
        return Object.keys(reportData.totals).sort();
    };

    /* =========================================================
       Combinar datos reales con datos manuales
    ========================================================= */
    const getCombinedTotals = () => {
        const combined = { ...reportData?.totals };
        Object.keys(manualData).forEach((year) => {
            const value = parseFloat(manualData[year]);
            const hasRealData = reportData?.totals?.[year] && reportData.totals[year] > 0;
            
            // Solo usar datos manuales si no hay datos reales o si los datos reales son 0
            if (!hasRealData && manualData[year] !== null && manualData[year] !== "" && !isNaN(value)) {
                combined[year] = value;
            }
        });
        return combined;
    };

    /* =========================================================
       Preparar datos para la gráfica de totales
    ========================================================= */
    const getTotalsChartData = () => {
        const combinedTotals = getCombinedTotals();
        const years = Object.keys(combinedTotals).sort();
        
        return years.map((year) => ({
            year,
            value: combinedTotals[year],
        }));
    };

    /* =========================================================
       Combinar datos de ciudades reales con manuales
    ========================================================= */
    const getCombinedCityData = () => {
        const combined = { ...reportData?.cities };
        
        Object.keys(manualCityData).forEach((cityYear) => {
            const [city, year] = cityYear.split('_');
            const value = parseFloat(manualCityData[cityYear]);
            const hasRealData = reportData?.cities?.[city]?.[year] && reportData.cities[city][year] > 0;
            
            if (!hasRealData && manualCityData[cityYear] !== null && manualCityData[cityYear] !== "" && !isNaN(value)) {
                if (!combined[city]) combined[city] = {};
                combined[city][year] = value;
            }
        });
        
        return combined;
    };

    /* =========================================================
       Preparar datos para la gráfica de ciudades
    ========================================================= */
    const getCitiesChartData = () => {
        const combinedCities = getCombinedCityData();
        if (!combinedCities || Object.keys(combinedCities).length === 0) return [];
        
        const combinedTotals = getCombinedTotals();
        const years = Object.keys(combinedTotals).sort();
        
        return Object.entries(combinedCities).map(([city, cityData]) => {
            const dataPoint = { city };
            years.forEach((year) => {
                dataPoint[year] = cityData[year] || 0;
            });
            return dataPoint;
        });
    };

    /* =========================================================
       Colores para las barras
    ========================================================= */
    const getColorForYear = (index) => {
        const colors = ["#9333ea", "#d946ef", "#a855f7", "#c084fc", "#e879f9"];
        return colors[index % colors.length];
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

    const years = getYears();
    const combinedTotals = getCombinedTotals();
    const combinedCities = getCombinedCityData();

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
                                        placeholder="Ej: 2024"
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
                                    <Select
                                        label="Tipo de Reporte"
                                        placeholder="Selecciona el tipo"
                                        value={reportType}
                                        onChange={setReportType}
                                        data={[
                                            { value: "hectolitros", label: "Hectolitros" },
                                            { value: "caja", label: "Caja" },
                                        ]}
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
                <div className="hidden md:grid md:grid-cols-7 grid-cols-1 gap-2 items-end">
                    <NumberInput
                        label="Año Inicial"
                        placeholder="Ej: 2024"
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
                    <Select
                        label="Tipo de Reporte"
                        placeholder="Selecciona"
                        value={reportType}
                        onChange={setReportType}
                        data={[
                            { value: "hectolitros", label: "Hectolitros" },
                            { value: "caja", label: "Caja" },
                        ]}
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

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader size="lg" />
                </div>
            ) : (
                <>
                    {/* ---------------- GRÁFICAS ---------------- */}
                    {years.length > 0 && (
                        <div className="mb-4 flex-shrink-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Gráfica de Totales por Año */}
                                <div className="bg-white p-4 rounded-lg shadow-md">
                                    <h3 className="text-lg font-bold mb-4 text-center">
                                        {reportType === "hectolitros"
                                            ? "Hectolitros"
                                            : "Cajas"}{" "}
                                        {startYear} vs {endYear} MTD
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={getTotalsChartData()}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="year" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => value.toFixed(2)}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="value"
                                                fill="#3b82f6"
                                                label={{
                                                    position: "top",
                                                    formatter: (value) => value.toFixed(0),
                                                }}
                                                name={
                                                    reportType === "hectolitros"
                                                        ? "Hectolitros"
                                                        : "Cajas"
                                                }
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Gráfica de Performance por Ciudad */}
                                <div className="bg-white p-4 rounded-lg shadow-md">
                                    <h3 className="text-lg font-bold mb-4 text-center">
                                        Performance Ciudad {startYear} vs {endYear} MTD
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={getCitiesChartData()}
                                            layout="vertical"
                                            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="city" width={90} />
                                            <Tooltip />
                                            <Legend />
                                            {years.map((year, index) => (
                                                <Bar
                                                    key={year}
                                                    dataKey={year}
                                                    fill={getColorForYear(index)}
                                                    name={year}
                                                    label={{
                                                        position: "right",
                                                        formatter: (value) =>
                                                            value > 0 ? value.toFixed(0) : "",
                                                    }}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---------------- TABLAS DE RESUMEN ---------------- */}
                    {years.length > 0 && (
                        <div className="flex-1 min-h-0 flex flex-col">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Tabla de Totales */}
                                <div className="bg-white p-4 rounded-lg shadow-md overflow-auto">
                                    <h3 className="text-lg font-bold mb-3">
                                        Totales por Año
                                    </h3>
                                    <table className="table w-full">
                                        <thead className="bg-primary text-white text-md uppercase font-bold">
                                            <tr>
                                                <th>Año</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-black">
                                            {years.map((year) => {
                                                const value = combinedTotals[year];
                                                const realValue = reportData?.totals?.[year];
                                                const hasNoData = realValue === undefined || realValue === null || realValue === 0;
                                                const isManual =
                                                    manualData[year] !== null &&
                                                    manualData[year] !== "" &&
                                                    manualData[year] !== undefined;
                                                return (
                                                    <tr key={year}>
                                                        <td className="font-bold">{year}</td>
                                                        <td>
                                                            {hasNoData && !isManual ? (
                                                                <Button
                                                                    size="xs"
                                                                    variant="light"
                                                                    color="blue"
                                                                    leftSection={<RiEditLine size={14} />}
                                                                    onClick={() => openYearModal(year)}
                                                                >
                                                                    Agregar
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    {value.toFixed(2)}
                                                                    {isManual && (
                                                                        <>
                                                                            <span className="ml-2 text-xs text-orange-600 font-semibold">
                                                                                (Manual)
                                                                            </span>
                                                                            <Button
                                                                                size="xs"
                                                                                variant="subtle"
                                                                                color="blue"
                                                                                ml="xs"
                                                                                onClick={() => openYearModal(year)}
                                                                            >
                                                                                <RiEditLine size={14} />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tabla de Ciudades */}
                                <div className="bg-white p-4 rounded-lg shadow-md overflow-auto">
                                    <h3 className="text-lg font-bold mb-3">
                                        Desglose por Ciudad
                                    </h3>
                                    <table className="table w-full">
                                        <thead className="bg-primary text-white text-md uppercase font-bold">
                                            <tr>
                                                <th>Ciudad</th>
                                                {years.map((year) => (
                                                    <th key={year}>{year}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-black">
                                            {Object.entries(combinedCities || {}).map(
                                                ([city, cityData]) => (
                                                    <tr key={city}>
                                                        <td className="font-bold">{city}</td>
                                                        {years.map((year) => {
                                                            const value = cityData[year];
                                                            const realValue = reportData?.cities?.[city]?.[year];
                                                            const hasNoData = realValue === undefined || realValue === null || realValue === 0;
                                                            const key = `${city}_${year}`;
                                                            const isManual = 
                                                                manualCityData[key] !== null &&
                                                                manualCityData[key] !== "" &&
                                                                manualCityData[key] !== undefined;
                                                            return (
                                                                <td key={year}>
                                                                    {hasNoData && !isManual ? (
                                                                        <Button
                                                                            size="xs"
                                                                            variant="light"
                                                                            color="blue"
                                                                            leftSection={<RiEditLine size={14} />}
                                                                            onClick={() => openCityModal(city, year)}
                                                                        >
                                                                            Agregar
                                                                        </Button>
                                                                    ) : value ? (
                                                                        <>
                                                                            {value.toFixed(2)}
                                                                            {isManual && (
                                                                                <>
                                                                                    <span className="ml-1 text-xs text-orange-600 font-semibold">
                                                                                        (M)
                                                                                    </span>
                                                                                    <Button
                                                                                        size="xs"
                                                                                        variant="subtle"
                                                                                        color="blue"
                                                                                        ml="xs"
                                                                                        onClick={() => openCityModal(city, year)}
                                                                                    >
                                                                                        <RiEditLine size={14} />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    ) : "-"}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {years.length === 0 && (
                        <div className="text-center py-8">
                            No se encontraron datos para el rango seleccionado.
                        </div>
                    )}
                </>
            )}

            {/* ---------------- MODALES ---------------- */}
            {/* Modal para agregar valor por año */}
            <Modal
                opened={modalYearOpen}
                onClose={() => {
                    setModalYearOpen(false);
                    setTempValue("");
                    setSelectedYear(null);
                }}
                title={`Agregar valor para el año ${selectedYear}`}
                centered
            >
                <NumberInput
                    label={"Valor"}
                    placeholder="Ingresa el valor"
                    value={tempValue}
                    onChange={setTempValue}
                    min={0}
                    decimalScale={2}
                    description={`Este valor se usará para el año ${selectedYear}`}
                />
                <div className="flex gap-2 mt-4">
                    <Button onClick={saveYearValue} variant="filled" fullWidth>
                        Guardar
                    </Button>
                    <Button
                        onClick={() => {
                            setModalYearOpen(false);
                            setTempValue("");
                            setSelectedYear(null);
                        }}
                        variant="outline"
                        fullWidth
                    >
                        Cancelar
                    </Button>
                </div>
            </Modal>

            {/* Modal para agregar valor por ciudad */}
            <Modal
                opened={modalCityOpen}
                onClose={() => {
                    setModalCityOpen(false);
                    setTempValue("");
                    setSelectedCity(null);
                    setSelectedCityYear(null);
                }}
                title={`Agregar valor para ${selectedCity} - ${selectedCityYear}`}
                centered
            >
                <NumberInput
                    label={"Valor"}
                    placeholder="Ingresa el valor"
                    value={tempValue}
                    onChange={setTempValue}
                    min={0}
                    decimalScale={2}
                    description={`Este valor se usará para ${selectedCity} en ${selectedCityYear}`}
                />
                <div className="flex gap-2 mt-4">
                    <Button onClick={saveCityValue} variant="filled" fullWidth>
                        Guardar
                    </Button>
                    <Button
                        onClick={() => {
                            setModalCityOpen(false);
                            setTempValue("");
                            setSelectedCity(null);
                            setSelectedCityYear(null);
                        }}
                        variant="outline"
                        fullWidth
                    >
                        Cancelar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
