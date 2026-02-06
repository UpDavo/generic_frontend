"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    TextInput,
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
    RiRefreshLine,
    RiCloseCircleLine,
    RiDownloadCloudLine,
    RiBarChartBoxLine,
    RiImageLine,
    RiWhatsappLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import {
    getWeeklyHectolitresReport,
    downloadWeeklyHectolitresReport,
} from "@/tada/services/ventasHistoricasApi";
import {
    generateChartImage,
    generateChartImageBase64,
    generateHectolitrosFilename,
} from "@/tada/services/salesImageGeneratorService";
import { sendReportToWhatsApp } from "@/tada/services/salesReportApi";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

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

    // Ref para capturar la sección de la gráfica
    const chartSectionRef = useRef(null);

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

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadingImage, setDownloadingImage] = useState(false);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedDateForReport, setSelectedDateForReport] = useState(null);

    /* =========================================================
       Traer Reporte
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await getWeeklyHectolitresReport(
                accessToken,
                appliedFilters.startDate,
                appliedFilters.endDate,
                "hectolitros"
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
                startDate: startDate,
                endDate: endDate,
            });
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
        } finally {
            setFiltering(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadWeeklyHectolitresReport(
                accessToken,
                appliedFilters.startDate,
                appliedFilters.endDate,
                "hectolitros"
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
       Descargar imagen de la gráfica
    ========================================================= */
    const downloadChartImage = useCallback(async () => {
        if (!chartSectionRef.current) return;

        setDownloadingImage(true);
        setError(null);

        try {
            const weekKeys = reportData
                ? Object.keys(reportData).filter((key) => key.startsWith("w")).sort()
                : [];
            const weekNumbers = weekKeys
                .map((key) => parseInt(key.replace("w", ""), 10))
                .filter((num) => !Number.isNaN(num));
            const startWeek = weekNumbers.length ? Math.min(...weekNumbers) : null;
            const endWeek = weekNumbers.length ? Math.max(...weekNumbers) : null;
            const startYear = appliedFilters.startDate
                ? new Date(appliedFilters.startDate).getFullYear()
                : null;
            const endYear = appliedFilters.endDate
                ? new Date(appliedFilters.endDate).getFullYear()
                : null;

            // Calcular número de semanas según datos reales del reporte
            const totalWeeks = Math.max(weekKeys.length, 1);

            // Ajustar ancho basado en el número de semanas (mínimo 1600, máximo 3200)
            const baseWidth = 1600;
            const extraWidthPerWeek = totalWeeks > 4 ? (totalWeeks - 4) * 150 : 0;
            const dynamicWidth = Math.min(baseWidth + extraWidthPerWeek, 3200);

            // Ajustar escala de fuente si hay muchas semanas
            const fontScale = totalWeeks > 8 ? 0.8 : totalWeeks > 4 ? 0.9 : 1;

            const filename = generateHectolitrosFilename({
                ...appliedFilters,
                startWeek,
                endWeek,
                startYear,
                endYear,
            });
            await generateChartImage(chartSectionRef.current, {
                filename,
                sectionId: "chartSection",
                width: dynamicWidth,
                scale: 2,
                padding: "40px 60px",
                fontScale,
            });
            setSuccessMessage("Imagen de la gráfica descargada exitosamente");
        } catch (err) {
            console.error("Error downloading chart image:", err);
            setError("Error al descargar la imagen. Intenta nuevamente.");
        } finally {
            setDownloadingImage(false);
        }
    }, [appliedFilters, reportData]);

    /* =========================================================
       Abrir modal para seleccionar fecha
    ========================================================= */
    const openDateSelectionModal = () => {
        setShowDateModal(true);
    };

    /* =========================================================
       Enviar imagen por WhatsApp con fecha seleccionada
    ========================================================= */
    const sendChartToWhatsApp = useCallback(async (selectedDate) => {
        if (!chartSectionRef.current) return;

        setSendingWhatsApp(true);
        setError(null);
        setShowDateModal(false);

        try {
            const weekKeys = reportData
                ? Object.keys(reportData).filter((key) => key.startsWith("w")).sort()
                : [];
            const totalWeeks = Math.max(weekKeys.length, 1);

            // Ajustar ancho basado en el número de semanas (mínimo 1600, máximo 3200)
            const baseWidth = 1600;
            const extraWidthPerWeek = totalWeeks > 4 ? (totalWeeks - 4) * 150 : 0;
            const dynamicWidth = Math.min(baseWidth + extraWidthPerWeek, 3200);

            // Ajustar escala de fuente si hay muchas semanas
            const fontScale = totalWeeks > 8 ? 0.8 : totalWeeks > 4 ? 0.9 : 1;

            // Generar imagen en base64
            const imageBase64 = await generateChartImageBase64(chartSectionRef.current, {
                sectionId: "chartSection",
                width: dynamicWidth,
                scale: 2,
                padding: "40px 60px",
                fontScale,
            });

            // Obtener información del día seleccionado
            const selectedDateObj = new Date(selectedDate + 'T00:00:00');
            const selectedDateString = selectedDate; // YYYY-MM-DD
            const selectedDayOfWeek = selectedDateObj.getDay(); // 0=dom, 1=lun, 2=mar, etc.

            // Mapear día de la semana a nuestro formato
            const dayMap = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
            const selectedDiaKey = dayMap[selectedDayOfWeek];

            let lastDate = selectedDateString;
            let lastDayName = DIAS_NOMBRES[selectedDiaKey] || "";
            let metaValue = 0;
            let actualValue = 0;
            let previousValue = 0;

            // Buscar los datos del día seleccionado en el reporte
            for (const weekKey of weekKeys) {
                const weekData = reportData[weekKey];
                if (weekData[selectedDiaKey] && weekData[selectedDiaKey].fecha === selectedDateString) {
                    const diaData = weekData[selectedDiaKey];
                    metaValue = parseFloat(diaData.ht_meta) || 0;
                    actualValue = parseFloat(diaData.ht) || 0;

                    // Buscar el mismo día de la semana anterior
                    const currentWeekIndex = weekKeys.indexOf(weekKey);
                    if (currentWeekIndex > 0) {
                        const previousWeekKey = weekKeys[currentWeekIndex - 1];
                        const previousWeekData = reportData[previousWeekKey];
                        if (previousWeekData && previousWeekData[selectedDiaKey]) {
                            previousValue = parseFloat(previousWeekData[selectedDiaKey].ht) || 0;
                        }
                    }
                    break;
                }
            }

            // Formatear fecha
            const [year, month, day] = lastDate.split('-');
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const monthName = monthNames[parseInt(month) - 1] || month;

            // Calcular porcentajes
            const cumplimientoPercent = metaValue > 0 ? ((actualValue / metaValue) * 100).toFixed(2) : 0;
            const variacionHistoricoPercent = previousValue > 0 ? (((actualValue - previousValue) / previousValue) * 100).toFixed(2) : 0;

            // Construir mensaje
            const title = `Corte día ${day} de ${monthName}\n\nCumplimiento:\nMeta ${metaValue.toFixed(2)} vs actual ${actualValue.toFixed(2)}\nCumplimiento ${cumplimientoPercent}%\n\nHistórico:\nSemana Anterior ${previousValue.toFixed(2)} vs actual ${actualValue.toFixed(2)}\nVariación ${variacionHistoricoPercent}%`;

            // Enviar por WhatsApp
            const response = await sendReportToWhatsApp(
                accessToken,
                imageBase64,
                title
            );

            // Mostrar overlay de éxito
            setShowSuccessOverlay(true);
        } catch (err) {
            console.error("Error sending to WhatsApp:", err);
            setError(err.message || "Error al enviar el reporte por WhatsApp");
            setSendingWhatsApp(false);
        }
    }, [accessToken, reportData]);

    /* =========================================================
       Cerrar overlay de éxito
    ========================================================= */
    const handleSuccessOverlayClose = () => {
        setShowSuccessOverlay(false);
        setSendingWhatsApp(false);
    };

    /* =========================================================
       Obtener todas las fechas disponibles en el reporte
    ========================================================= */
    const getAvailableDates = () => {
        if (!reportData) return [];
        const dates = [];
        const weekKeys = Object.keys(reportData).filter((key) => key.startsWith("w")).sort();
        
        weekKeys.forEach((weekKey) => {
            const weekData = reportData[weekKey];
            DIAS_SEMANA.forEach((dia) => {
                if (weekData[dia] && weekData[dia].fecha) {
                    const ht = parseFloat(weekData[dia].ht) || 0;
                    // Solo agregar fechas con ventas mayores a 0
                    if (ht > 0) {
                        dates.push({
                            fecha: weekData[dia].fecha,
                            dia: DIAS_NOMBRES[dia],
                        });
                    }
                }
            });
        });
        
        return dates.sort((a, b) => b.fecha.localeCompare(a.fecha)); // Ordenar de más reciente a más antigua
    };

    /* =========================================================
       Obtener las semanas del reporte
    ========================================================= */
    const getWeekKeys = () => {
        if (!reportData) return [];
        return Object.keys(reportData).filter((key) => key.startsWith("w")).sort();
    };

    /* =========================================================
       Preparar datos para la gráfica
    ========================================================= */
    const getChartData = () => {
        if (!reportData) return [];
        const chartData = [];

        getWeekKeys().forEach((weekKey) => {
            const weekData = reportData[weekKey];
            DIAS_SEMANA.forEach((dia) => {
                const diaData = weekData[dia];
                if (diaData) {
                    chartData.push({
                        label: `${weekKey.replace("w", "W")} - ${DIAS_NOMBRES[dia].substring(0, 3)}`,
                        fecha: diaData.fecha,
                        meta: parseFloat(diaData.ht_meta) || 0,
                        vendidos: parseFloat(diaData.ht) || 0,
                        cumplimiento: parseFloat(diaData.cumplimiento?.replace('%', '')) || 0,
                    });
                }
            });
        });

        return chartData;
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
        <div className="text-black flex flex-col overflow-auto h-full">
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

            {/* ---------------- GRÁFICA ---------------- */}
            {reportData && getWeekKeys().length > 0 && (
                <div className="mb-4 flex-shrink-0">
                    <Accordion variant="contained" defaultValue="chart">
                        <Accordion.Item value="chart">
                            <Accordion.Control>
                                <div className="flex items-center gap-2">
                                    <RiBarChartBoxLine size={20} />
                                    <span className="font-bold">Gráfica de Hectolitros</span>
                                </div>
                            </Accordion.Control>
                            <Accordion.Panel>
                                {/* Botones de descarga de imagen y WhatsApp */}
                                <div className="mb-4 flex gap-2 flex-wrap">
                                    <Button
                                        onClick={downloadChartImage}
                                        variant="outline"
                                        color="violet"
                                        leftSection={<RiImageLine />}
                                        loading={downloadingImage}
                                    >
                                        Descargar Imagen
                                    </Button>
                                    <Button
                                        onClick={openDateSelectionModal}
                                        variant="filled"
                                        color="green"
                                        leftSection={<RiWhatsappLine />}
                                        loading={sendingWhatsApp}
                                    >
                                        Enviar por WhatsApp
                                    </Button>
                                </div>

                                {/* Contenedor para capturar imagen con métricas y gráfica */}
                                <div ref={chartSectionRef} style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '8px' }}>
                                    {/* Métricas resumen dentro de la captura */}
                                    {reportData?.total && (
                                        <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', marginBottom: '24px' }}>
                                            <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                                <div style={{ fontSize: '14px', backgroundColor: '#eff6ff', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    Hectolitros Vendidos
                                                </div>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                                    {reportData.total.ht_vendidos?.toFixed(2) || "0.00"}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
                                                <div style={{ fontSize: '14px', backgroundColor: '#f0fdf4', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    Meta de Hectolitros
                                                </div>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                                                    {reportData.total.ht_meta?.toFixed(2) || "0.00"}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                                                <div style={{ fontSize: '14px', backgroundColor: '#faf5ff', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    Cumplimiento
                                                </div>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', backgroundColor: '#faf5ff', color: '#9333ea' }}>
                                                    {reportData.total.cumplimiento || "0%"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart
                                            data={getChartData()}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                            <XAxis
                                                dataKey="label"
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                                interval={0}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                label={{ value: 'Hectolitros', angle: -90, position: 'insideLeft' }}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                label={{ value: 'Cumplimiento %', angle: 90, position: 'insideRight' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                                                formatter={(value, name) => {
                                                    if (name === 'cumplimiento') return [value + '%', 'Cumplimiento'];
                                                    return [value.toFixed(2), name === 'meta' ? 'Meta' : 'Vendidos'];
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{ paddingTop: '10px' }}
                                                formatter={(value) => {
                                                    if (value === 'meta') return 'Meta';
                                                    if (value === 'vendidos') return 'Vendidos';
                                                    if (value === 'cumplimiento') return 'Cumplimiento %';
                                                    return value;
                                                }}
                                            />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="meta"
                                                fill="#d946ef"
                                                opacity={0.7}
                                                name="meta"
                                            />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="vendidos"
                                                fill="#9333ea"
                                                name="vendidos"
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="cumplimiento"
                                                stroke="#000000"
                                                strokeWidth={2}
                                                dot={{ fill: '#000000', r: 4 }}
                                                name="cumplimiento"
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>

                                    {/* Tabla de datos debajo de la gráfica */}
                                    <div className="overflow-x-auto">
                                        <table className="table w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 px-4 py-2 text-center font-bold min-w-[80px]">Día</th>
                                                    {getChartData().map((item, idx) => (
                                                        <th key={idx} className="border border-gray-300 px-2 py-1 text-center font-bold whitespace-nowrap">
                                                            {item.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="bg-gray-50">
                                                    <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">Fecha</td>
                                                    {getChartData().map((item, idx) => {
                                                        const [year, month, day] = item.fecha.split('-');
                                                        return (
                                                            <td key={idx} className="border border-gray-300 px-2 py-1 text-center text-xs">
                                                                {day}/{month}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                <tr className="bg-purple-50">
                                                    <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">Meta</td>
                                                    {getChartData().map((item, idx) => (
                                                        <td key={idx} className="border border-gray-300 px-2 py-1 text-center">
                                                            {item.meta.toFixed(2)}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="bg-blue-50">
                                                    <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">Venta</td>
                                                    {getChartData().map((item, idx) => (
                                                        <td key={idx} className="border border-gray-300 px-2 py-1 text-center">
                                                            {item.vendidos.toFixed(2)}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="bg-gray-50">
                                                    <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">% Cumpl.</td>
                                                    {getChartData().map((item, idx) => (
                                                        <td key={idx} className="border border-gray-300 px-2 py-1 text-center font-semibold">
                                                            {item.cumplimiento.toFixed(0)}%
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </div>
            )}

            {/* ---------------- RESUMEN TOTAL (visible en la página) ---------------- */}
            {/* {reportData?.total && (
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
            )} */}

            {/* ---------------- TABLA ---------------- */}
            <div className="flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : reportData && getWeekKeys().length > 0 ? (
                    <>
                        {/* Vista Desktop - Tabla Única */}
                        <div className="hidden md:block rounded-md">
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
                        <div className="md:hidden block space-y-6">
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
                )}            </div>

            {/* Modal de selección de fecha */}
            <Modal
                opened={showDateModal}
                onClose={() => setShowDateModal(false)}
                title="Selecciona el día del reporte"
                centered
                size="lg"
            >
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-4">
                        Selecciona la fecha para la cual deseas enviar el reporte por WhatsApp:
                    </p>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {getAvailableDates().map((item, idx) => (
                            <Button
                                key={idx}
                                onClick={() => sendChartToWhatsApp(item.fecha)}
                                variant="light"
                                fullWidth
                                className="justify-start"
                            >
                                <div className="flex justify-between w-full">
                                    <span>{item.fecha}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
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
