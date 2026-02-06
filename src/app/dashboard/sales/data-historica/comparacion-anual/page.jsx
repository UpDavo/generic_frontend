"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Button,
    Loader,
    Notification,
    NumberInput,
    Select,
    Accordion,
} from "@mantine/core";
import {
    RiSearchLine,
    RiCloseCircleLine,
    RiDownloadCloudLine,
    RiRefreshLine,
    RiImageLine,
    RiWhatsappLine,
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
    // Función para calcular el número de semana del año
    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // Obtener semanas del mes actual
    const getCurrentMonthWeeks = () => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return {
            startWeek: getWeekNumber(firstDayOfMonth),
            endWeek: getWeekNumber(lastDayOfMonth)
        };
    };

    const currentYear = new Date().getFullYear();
    const currentMonthWeeks = getCurrentMonthWeeks();
    
    const [startYear, setStartYear] = useState(currentYear - 1);
    const [endYear, setEndYear] = useState(currentYear);
    const [startWeek, setStartWeek] = useState(currentMonthWeeks.startWeek);
    const [endWeek, setEndWeek] = useState(currentMonthWeeks.endWeek);
    const [reportType, setReportType] = useState("hectolitros");
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        startYear: currentYear - 1,
        endYear: currentYear,
        startWeek: currentMonthWeeks.startWeek,
        endWeek: currentMonthWeeks.endWeek,
        reportType: "hectolitros",
    });

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            const currentYear = new Date().getFullYear();
            const monthWeeks = getCurrentMonthWeeks();
            
            setStartYear(currentYear - 1);
            setEndYear(currentYear);
            setStartWeek(monthWeeks.startWeek);
            setEndWeek(monthWeeks.endWeek);
            setReportType("hectolitros");
            setAppliedFilters({
                startYear: currentYear - 1,
                endYear: currentYear,
                startWeek: monthWeeks.startWeek,
                endWeek: monthWeeks.endWeek,
                reportType: "hectolitros",
            });
        } finally {
            setFiltering(false);
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
                startYear: appliedFilters.startYear,
                endYear: appliedFilters.endYear,
                startWeek: appliedFilters.startWeek,
                endWeek: appliedFilters.endWeek,
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

            // Formatear fechas para el mensaje
            const reportLabel = appliedFilters.reportType === "hectolitros" ? "Hectolitros" : "Cajas";

            // Obtener años y totales directamente
            const years = reportData?.totals ? Object.keys(reportData.totals).sort() : [];
            const combinedTotals = reportData?.totals || {};

            let comparisonText = "";
            if (years.length >= 2) {
                const sortedYears = [...years].sort();
                const firstYear = sortedYears[0];
                const lastYear = sortedYears[sortedYears.length - 1];
                const firstYearValue = combinedTotals[firstYear] || 0;
                const lastYearValue = combinedTotals[lastYear] || 0;
                const variacion = firstYearValue > 0 ? (((lastYearValue - firstYearValue) / firstYearValue) * 100).toFixed(2) : 0;

                comparisonText = `\n\nComparación Año sobre Año:\n${firstYear}: ${firstYearValue.toFixed(2)}\n${lastYear}: ${lastYearValue.toFixed(2)}\nVariación: ${variacion}%`;
            }

            const title = `Comparación Anual - ${reportLabel}\nSemanas ${appliedFilters.startWeek}-${appliedFilters.endWeek}: ${appliedFilters.startYear} vs ${appliedFilters.endYear}${comparisonText}`;

            const response = await sendReportToWhatsApp(accessToken, imageBase64, title);

            // Mostrar overlay de éxito
            setShowSuccessOverlay(true);
        } catch (err) {
            console.error("Error sending to WhatsApp:", err);
            setError(err.message || "Error al enviar el reporte por WhatsApp");
            setSendingWhatsApp(false);
        }
    }, [accessToken, appliedFilters, reportData]);

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
       Obtener totales del reporte
    ========================================================= */
    const getCombinedTotals = () => {
        if (!reportData?.totals) return {};
        return reportData.totals;
    };

    /* =========================================================
       Preparar datos para la gráfica de totales
    ========================================================= */
    const getTotalsChartData = () => {
        const combinedTotals = getCombinedTotals();
        const years = Object.keys(combinedTotals).sort();

        // Crear un solo objeto con todos los años como propiedades
        const chartData = { name: "Total" };
        years.forEach((year) => {
            chartData[year] = combinedTotals[year] || 0;
        });

        return [chartData];
    };

    /* =========================================================
       Obtener datos de ciudades del reporte
    ========================================================= */
    const getCombinedCityData = () => {
        if (!reportData?.cities) return {};
        return reportData.cities;
    };

    /* =========================================================
       Preparar datos para la gráfica de ciudades
    ========================================================= */
    const getCitiesChartData = () => {
        const combinedCities = getCombinedCityData();
        if (!combinedCities || Object.keys(combinedCities).length === 0) return [];

        const years = getYears();
        const currentYear = appliedFilters.endYear.toString();

        // Crear array de ciudades con sus datos
        const citiesArray = Object.entries(combinedCities).map(([city, cityData]) => {
            const dataPoint = { city };
            years.forEach((year) => {
                dataPoint[year] = cityData[year] || 0;
            });
            return dataPoint;
        });

        // Ordenar por el año actual de mayor a menor
        citiesArray.sort((a, b) => (b[currentYear] || 0) - (a[currentYear] || 0));

        return citiesArray;
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
                    {/* ---------------- SECCIÓN PARA CAPTURA DE IMAGEN (SOLO GRÁFICAS) ---------------- */}
                    {years.length > 0 && (
                        <>
                            <div id="chartSection" ref={chartSectionRef} className="mb-4 flex-shrink-0">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Gráfica de Totales por Año */}
                                    <div className="bg-white p-4 rounded-lg shadow-md">
                                        <h3 className="text-lg font-bold mb-4 text-center">
                                            {reportType === "hectolitros"
                                                ? "Hectolitros"
                                                : "Cajas"}{" "}
                                            Comparación Anual MTD
                                        </h3>
                                        <ResponsiveContainer width="100%" height={450}>
                                            <BarChart
                                                data={getTotalsChartData()}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value) => value.toFixed(2)}
                                                />
                                                <Legend />
                                                {years.map((year, index) => (
                                                    <Bar
                                                        key={year}
                                                        dataKey={year}
                                                        fill={getColorForYear(index)}
                                                        name={year}
                                                        label={{
                                                            position: "top",
                                                            formatter: (value) => value.toFixed(0),
                                                        }}
                                                    />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Gráfica de Performance por Ciudad */}
                                    <div className="bg-white p-4 rounded-lg shadow-md">
                                        <h3 className="text-lg font-bold mb-4 text-center">
                                            Performance por Ciudad - Comparación Anual MTD
                                        </h3>
                                        <ResponsiveContainer width="100%" height={450}>
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

                            {/* ---------------- TABLAS DE RESUMEN (NO SE CAPTURA EN IMAGEN) ---------------- */}
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

                                                    return (
                                                        <tr key={year}>
                                                            <td className="font-bold">{year}</td>
                                                            <td>
                                                                {value !== undefined && value !== null ? value.toFixed(2) : "0.00"}
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
                                                {Object.entries(combinedCities || {})
                                                    .sort(([, cityDataA], [, cityDataB]) => {
                                                        const currentYear = appliedFilters.endYear.toString();
                                                        const valueA = cityDataA[currentYear] || 0;
                                                        const valueB = cityDataB[currentYear] || 0;
                                                        return valueB - valueA; // De mayor a menor
                                                    })
                                                    .map(
                                                        ([city, cityData]) => (
                                                            <tr key={city}>
                                                                <td className="font-bold">{city}</td>
                                                                {years.map((year) => {
                                                                    const value = cityData[year];

                                                                    return (
                                                                        <td key={year}>
                                                                            {value !== undefined && value !== null ? value.toFixed(2) : "0.00"}
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
                        </>
                    )}

                    {years.length === 0 && (
                        <div className="text-center py-8">
                            No se encontraron datos para el rango seleccionado.
                        </div>
                    )}
                </>
            )}

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
