"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    RiImageLine,
    RiWhatsappLine,
    RiAddLine,
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
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import { ENV } from "@/config/env";
import { generateChartImage, generateChartImageBase64, generateComparacionAnualFilename } from "@/tada/services/salesImageGeneratorService";
import { sendReportToWhatsApp } from "@/tada/services/salesReportApi";
import { createManualYearlyData, updateManualYearlyData } from "@/tada/services/manualYearlyDataApi";

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
        startYear: currentYear - 1,
        endYear: currentYear,
        startWeek: 1,
        endWeek: 4,
        reportType: "hectolitros",
    });

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ------------------- MODALES ------------------- */
    const [modalYearOpen, setModalYearOpen] = useState(false);
    const [modalCityOpen, setModalCityOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedCityYear, setSelectedCityYear] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedManualId, setSelectedManualId] = useState(null);
    const [savingManual, setSavingManual] = useState(false);

    /* ------------------- IMAGEN ------------------- */
    const chartSectionRef = useRef(null);
    const [downloadingImage, setDownloadingImage] = useState(false);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

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
        } finally {
            setFiltering(false);
        }
    };

    const openYearModal = (year, isEdit = false, manualId = null, currentValue = "") => {
        setSelectedYear(year);
        setIsEditMode(isEdit);
        setSelectedManualId(manualId);
        setTempValue(currentValue);
        setModalYearOpen(true);
    };

    const saveYearValue = async () => {
        if (tempValue === null || tempValue === "") return;

        setSavingManual(true);
        try {
            if (isEditMode && selectedManualId) {
                // Actualizar dato existente
                await updateManualYearlyData(accessToken, selectedManualId, {
                    value: parseFloat(tempValue),
                });
                setSuccessMessage("Dato actualizado correctamente");
            } else {
                // Crear nuevo dato
                await createManualYearlyData(accessToken, {
                    year: parseInt(selectedYear),
                    start_week: appliedFilters.startWeek,
                    end_week: appliedFilters.endWeek,
                    report_type: appliedFilters.reportType,
                    city: null,
                    value: parseFloat(tempValue),
                });
                setSuccessMessage("Dato creado correctamente");
            }

            // Refrescar datos
            await fetchReport();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.message || "Error al guardar el dato");
        } finally {
            setSavingManual(false);
            setModalYearOpen(false);
            setTempValue("");
            setSelectedYear(null);
            setIsEditMode(false);
            setSelectedManualId(null);
        }
    };

    const openCityModal = (city, year, isEdit = false, manualId = null, currentValue = "") => {
        setSelectedCity(city);
        setSelectedCityYear(year);
        setIsEditMode(isEdit);
        setSelectedManualId(manualId);
        setTempValue(currentValue);
        setModalCityOpen(true);
    };

    const saveCityValue = async () => {
        if (tempValue === null || tempValue === "") return;

        setSavingManual(true);
        try {
            if (isEditMode && selectedManualId) {
                // Actualizar dato existente
                await updateManualYearlyData(accessToken, selectedManualId, {
                    value: parseFloat(tempValue),
                });
                setSuccessMessage("Dato actualizado correctamente");
            } else {
                // Crear nuevo dato
                await createManualYearlyData(accessToken, {
                    year: parseInt(selectedCityYear),
                    start_week: appliedFilters.startWeek,
                    end_week: appliedFilters.endWeek,
                    report_type: appliedFilters.reportType,
                    city: selectedCity,
                    value: parseFloat(tempValue),
                });
                setSuccessMessage("Dato creado correctamente");
            }

            // Refrescar datos
            await fetchReport();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.message || "Error al guardar el dato");
        } finally {
            setSavingManual(false);
            setModalCityOpen(false);
            setTempValue("");
            setSelectedCity(null);
            setSelectedCityYear(null);
            setIsEditMode(false);
            setSelectedManualId(null);
        }
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

    const downloadChartImage = useCallback(async () => {
        if (!chartSectionRef.current) {
            setError("No se encontró la sección para capturar");
            return;
        }

        setDownloadingImage(true);
        try {
            const filename = generateComparacionAnualFilename({
                startWeek: appliedFilters.startWeek,
                endWeek: appliedFilters.endWeek,
                startYear: appliedFilters.startYear,
                endYear: appliedFilters.endYear,
                reportType: appliedFilters.reportType,
            });

            await generateChartImage(chartSectionRef.current, {
                filename,
                width: 1800,
                scale: 2,
                padding: "60px 80px",
                sectionId: "chartSection",
                hideSelectors: [
                    "button",
                    ".mantine-Button-root",
                    "[class*='Button']",
                ],
            });

            setSuccessMessage("Imagen descargada correctamente");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.message || "Error al generar la imagen");
        } finally {
            setDownloadingImage(false);
        }
    }, [appliedFilters]);

    /* =========================================================
       Enviar imagen por WhatsApp
    ========================================================= */
    const sendChartToWhatsApp = useCallback(async () => {
        if (!chartSectionRef.current) {
            setError("No se encontró la sección para capturar");
            return;
        }

        setSendingWhatsApp(true);
        setError(null);

        try {
            const imageBase64 = await generateChartImageBase64(chartSectionRef.current, {
                sectionId: "chartSection",
                width: 1800,
                scale: 2,
                padding: "60px 80px",
                hideSelectors: [
                    "button",
                    ".mantine-Button-root",
                    "[class*='Button']",
                ],
            });

            const weekRange = `S${appliedFilters.startWeek}-${appliedFilters.endWeek}`;
            const yearRange = `${appliedFilters.startYear}-${appliedFilters.endYear}`;
            const reportLabel = appliedFilters.reportType === "hectolitros" ? "Hectolitros" : "Cajas";
            const title = `Comparación Anual ${reportLabel} ${weekRange} ${yearRange}`;

            const response = await sendReportToWhatsApp(accessToken, imageBase64, title);

            // Mostrar overlay de éxito
            setShowSuccessOverlay(true);
        } catch (err) {
            console.error("Error sending to WhatsApp:", err);
            setError(err.message || "Error al enviar el reporte por WhatsApp");
            setSendingWhatsApp(false);
        }
    }, [accessToken, appliedFilters]);

    /* =========================================================
       Cerrar overlay de éxito
    ========================================================= */
    const handleSuccessOverlayClose = () => {
        setShowSuccessOverlay(false);
        setSendingWhatsApp(false);
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
        if (!reportData?.totals) return {};

        const combined = {};
        Object.entries(reportData.totals).forEach(([year, data]) => {
            // El nuevo formato tiene { value, is_manual, id? }
            combined[year] = typeof data === 'object' ? data.value : data;
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
            value: combinedTotals[year] || 0,
        }));
    };

    /* =========================================================
       Combinar datos de ciudades reales con manuales
    ========================================================= */
    const getCombinedCityData = () => {
        if (!reportData?.cities) return {};

        const combined = {};
        Object.entries(reportData.cities).forEach(([city, cityData]) => {
            combined[city] = {};
            Object.entries(cityData).forEach(([year, data]) => {
                // El nuevo formato tiene { value, is_manual, id? }
                combined[city][year] = typeof data === 'object' ? data.value : data;
            });
        });

        return combined;
    };

    /* =========================================================
       Preparar datos para la gráfica de ciudades
    ========================================================= */
    const getCitiesChartData = () => {
        const combinedCities = getCombinedCityData();
        if (!combinedCities || Object.keys(combinedCities).length === 0) return [];

        const years = getYears();

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

            {successMessage && (
                <Notification color="green" className="mb-4" onClose={() => setSuccessMessage(null)}>
                    {successMessage}
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
                    <Button
                        onClick={downloadChartImage}
                        variant="filled"
                        color="violet"
                        leftSection={<RiImageLine />}
                        className="flex-1 md:flex-none"
                        disabled={downloadingImage || loading || !reportData}
                    >
                        {downloadingImage ? <Loader size="xs" color="white" /> : "Descargar Imagen"}
                    </Button>
                    <Button
                        onClick={sendChartToWhatsApp}
                        variant="filled"
                        color="green"
                        leftSection={<RiWhatsappLine />}
                        loading={sendingWhatsApp}
                        disabled={loading || !reportData}
                        className="flex-1 md:flex-none"
                    >
                        Enviar por WhatsApp
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
                    {/* ---------------- SECCIÓN PARA CAPTURA DE IMAGEN ---------------- */}
                    {years.length > 0 && (
                        <div id="chartSection" ref={chartSectionRef}>
                            {/* ---------------- GRÁFICAS ---------------- */}
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

                            {/* ---------------- TABLAS DE RESUMEN ---------------- */}
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
                                                    const rawData = reportData?.totals?.[year];
                                                    const value = combinedTotals[year];
                                                    const isManual = typeof rawData === 'object' && rawData?.is_manual;
                                                    const manualId = typeof rawData === 'object' ? rawData?.manual_id : null;
                                                    const hasNoData = value === undefined || value === null || value === 0;

                                                    return (
                                                        <tr key={year}>
                                                            <td className="font-bold">{year}</td>
                                                            <td>
                                                                {hasNoData ? (
                                                                    <Button
                                                                        size="xs"
                                                                        variant="light"
                                                                        color="blue"
                                                                        leftSection={<RiAddLine size={14} />}
                                                                        onClick={() => openYearModal(year, false, null, "")}
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
                                                                                    onClick={() => openYearModal(year, true, manualId, value)}
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
                                                                const rawCityData = reportData?.cities?.[city]?.[year];
                                                                const isManual = typeof rawCityData === 'object' && rawCityData?.is_manual;
                                                                const manualId = typeof rawCityData === 'object' ? rawCityData?.manual_id : null;
                                                                const hasNoData = value === undefined || value === null || value === 0;

                                                                return (
                                                                    <td key={year}>
                                                                        {hasNoData ? (
                                                                            <Button
                                                                                size="xs"
                                                                                variant="light"
                                                                                color="blue"
                                                                                leftSection={<RiAddLine size={14} />}
                                                                                onClick={() => openCityModal(city, year, false, null, "")}
                                                                            >
                                                                                Agregar
                                                                            </Button>
                                                                        ) : (
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
                                                                                            onClick={() => openCityModal(city, year, true, manualId, value)}
                                                                                        >
                                                                                            <RiEditLine size={14} />
                                                                                        </Button>
                                                                                    </>
                                                                                )}
                                                                            </>
                                                                        )}
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
                    if (!savingManual) {
                        setModalYearOpen(false);
                        setTempValue("");
                        setSelectedYear(null);
                        setIsEditMode(false);
                        setSelectedManualId(null);
                    }
                }}
                title={`${isEditMode ? "Editar" : "Agregar"} valor para el año ${selectedYear}`}
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
                    disabled={savingManual}
                />
                <div className="flex gap-2 mt-4">
                    <Button
                        onClick={saveYearValue}
                        variant="filled"
                        fullWidth
                        loading={savingManual}
                        disabled={savingManual || tempValue === "" || tempValue === null}
                    >
                        {isEditMode ? "Actualizar" : "Guardar"}
                    </Button>
                    <Button
                        onClick={() => {
                            setModalYearOpen(false);
                            setTempValue("");
                            setSelectedYear(null);
                            setIsEditMode(false);
                            setSelectedManualId(null);
                        }}
                        variant="outline"
                        fullWidth
                        disabled={savingManual}
                    >
                        Cancelar
                    </Button>
                </div>
            </Modal>

            {/* Modal para agregar valor por ciudad */}
            <Modal
                opened={modalCityOpen}
                onClose={() => {
                    if (!savingManual) {
                        setModalCityOpen(false);
                        setTempValue("");
                        setSelectedCity(null);
                        setSelectedCityYear(null);
                        setIsEditMode(false);
                        setSelectedManualId(null);
                    }
                }}
                title={`${isEditMode ? "Editar" : "Agregar"} valor para ${selectedCity} - ${selectedCityYear}`}
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
                    disabled={savingManual}
                />
                <div className="flex gap-2 mt-4">
                    <Button
                        onClick={saveCityValue}
                        variant="filled"
                        fullWidth
                        loading={savingManual}
                        disabled={savingManual || tempValue === "" || tempValue === null}
                    >
                        {isEditMode ? "Actualizar" : "Guardar"}
                    </Button>
                    <Button
                        onClick={() => {
                            setModalCityOpen(false);
                            setTempValue("");
                            setSelectedCity(null);
                            setSelectedCityYear(null);
                            setIsEditMode(false);
                            setSelectedManualId(null);
                        }}
                        variant="outline"
                        fullWidth
                        disabled={savingManual}
                    >
                        Cancelar
                    </Button>
                </div>
            </Modal>

            <ProcessingOverlay
                isProcessing={sendingWhatsApp}
                showSuccess={showSuccessOverlay}
                successMessage="¡Reporte enviado por WhatsApp exitosamente!"
                processingMessage="Enviando reporte por WhatsApp..."
                onSuccessClose={handleSuccessOverlayClose}
            />
        </div>
    );
}
