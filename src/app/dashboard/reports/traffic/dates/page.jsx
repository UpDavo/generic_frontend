"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    TextInput,
    Button,
    Loader,
    Notification,
    Accordion,
    Modal,
} from "@mantine/core";
import {
    RiSearchLine,
    RiRefreshLine,
    RiCloseCircleLine,
    RiBarChartBoxLine,
    RiImageLine,
    RiWhatsappLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import { getSalesByDateRange } from "@/tada/services/reportsApi";
import { getDailyMetas } from "@/tada/services/dailyMetaApi";
import {
    generateChartImage,
    generateChartImageBase64,
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

const PERMISSION_PATH = "/dashboard/reports/traffic/dates";

const getISOWeek = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

/* =========================================================
   Sub-componente de gráfica — necesario para que recharts
   establezca correctamente su contexto dentro de Mantine
========================================================= */
function VentasChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
                data={data}
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
                    label={{ value: "Ventas", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                        value: "Cumplimiento %",
                        angle: 90,
                        position: "insideRight",
                    }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                    formatter={(value, name) => {
                        if (name === "cumplimiento") return [value + "%", "Cumplimiento"];
                        return [value, name === "meta" ? "Meta" : "Ventas"];
                    }}
                />
                <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
                    formatter={(value) => {
                        if (value === "meta") return "Meta";
                        if (value === "ventas") return "Ventas";
                        if (value === "cumplimiento") return "Cumplimiento %";
                        return value;
                    }}
                />
                <Bar yAxisId="left" dataKey="meta" fill="#d946ef" opacity={0.7} name="meta" />
                <Bar yAxisId="left" dataKey="ventas" fill="#9333ea" name="ventas" />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumplimiento"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={{ fill: "#000000", r: 4 }}
                    name="cumplimiento"
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

const getMonthStart = () =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);

const getMonthEnd = () =>
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

export default function SalesByDateRangePage() {
    const { accessToken, user } = useAuth();
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
    const [startDate, setStartDate] = useState(getMonthStart());
    const [endDate, setEndDate] = useState(getMonthEnd());
    const [filtering, setFiltering] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: getMonthStart(),
        endDate: getMonthEnd(),
    });

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [metasData, setMetasData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingImage, setDownloadingImage] = useState(false);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);

    /* =========================================================
       Traer datos
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [salesData, metas] = await Promise.all([
                getSalesByDateRange(
                    accessToken,
                    appliedFilters.startDate,
                    appliedFilters.endDate
                ),
                getDailyMetas(accessToken, appliedFilters.startDate, appliedFilters.endDate),
            ]);
            setReportData(salesData);
            setMetasData(metas || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Error al cargar el reporte de ventas por fecha");
        } finally {
            setLoading(false);
        }
    }, [accessToken, appliedFilters]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    /* =========================================================
       Handlers de filtro
    ========================================================= */
    const applyFilters = async () => {
        setFiltering(true);
        try {
            setAppliedFilters({ startDate, endDate });
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

    /* =========================================================
       Preparar datos para la gráfica
    ========================================================= */
    const getChartData = () => {
        if (!reportData) return [];
        return reportData.map((d) => {
            const totalVentas = d.ventas.reduce((acc, v) => acc + v.ventas, 0);
            const meta = metasData.find((m) => m.date === d.fecha);
            const metaValue = meta ? meta.target_count : 0;
            const cumplimiento =
                metaValue > 0
                    ? parseFloat(((totalVentas / metaValue) * 100).toFixed(2))
                    : 0;
            return {
                label: `${d.dia.substring(0, 3)} ${d.numero}`,
                dia: d.dia,
                fecha: d.fecha,
                ventas: totalVentas,
                meta: metaValue,
                cumplimiento,
                weekNum: getISOWeek(d.fecha),
            };
        });
    };

    const getTotal = () => {
        const chartData = getChartData();
        const totalVentas = chartData.reduce((acc, d) => acc + d.ventas, 0);
        const totalMeta = chartData.reduce((acc, d) => acc + d.meta, 0);
        const cumplimiento =
            totalMeta > 0
                ? `${((totalVentas / totalMeta) * 100).toFixed(2)}%`
                : "—";
        return { totalVentas, totalMeta, cumplimiento };
    };

    /* =========================================================
       Obtener fechas disponibles (con ventas > 0)
    ========================================================= */
    const getAvailableDates = () => {
        if (!reportData) return [];
        return reportData
            .filter((d) => d.ventas.reduce((acc, v) => acc + v.ventas, 0) > 0)
            .map((d) => ({ fecha: d.fecha, dia: d.dia }))
            .sort((a, b) => b.fecha.localeCompare(a.fecha));
    };

    /* =========================================================
       Descargar imagen de la gráfica
    ========================================================= */
    const downloadChartImage = useCallback(async () => {
        if (!chartSectionRef.current) return;
        setDownloadingImage(true);
        setError(null);
        try {
            const filename = `ventas-por-fecha_${appliedFilters.startDate}_${appliedFilters.endDate}`;
            await generateChartImage(chartSectionRef.current, {
                filename,
                sectionId: "chartSection",
                width: 1600,
                scale: 2,
                padding: "40px 60px",
            });
            setSuccessMessage("Imagen de la gráfica descargada exitosamente");
        } catch (err) {
            console.error(err);
            setError("Error al descargar la imagen. Intenta nuevamente.");
        } finally {
            setDownloadingImage(false);
        }
    }, [appliedFilters]);

    /* =========================================================
       Enviar imagen por WhatsApp
    ========================================================= */
    const sendChartToWhatsApp = useCallback(
        async (selectedDate) => {
            if (!chartSectionRef.current) return;
            setSendingWhatsApp(true);
            setError(null);
            setShowDateModal(false);
            try {
                const imageBase64 = await generateChartImageBase64(
                    chartSectionRef.current,
                    {
                        sectionId: "chartSection",
                        width: 1600,
                        scale: 2,
                        padding: "40px 60px",
                    }
                );

                // Buscar datos del día seleccionado
                const dayData = reportData?.find((d) => d.fecha === selectedDate);
                const totalVentas = dayData
                    ? dayData.ventas.reduce((acc, v) => acc + v.ventas, 0)
                    : 0;
                const meta = metasData.find((m) => m.date === selectedDate);
                const metaValue = meta ? meta.target_count : 0;
                const cumplimiento =
                    metaValue > 0
                        ? ((totalVentas / metaValue) * 100).toFixed(2)
                        : 0;

                const [year, month, day] = selectedDate.split("-");
                const monthNames = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
                ];
                const monthName = monthNames[parseInt(month) - 1] || month;

                const title = `Ventas ${day} de ${monthName} ${year} — ${cumplimiento}%\n\nCumplimiento:\nMeta ${metaValue} vs Real ${totalVentas}`;

                await sendReportToWhatsApp(accessToken, imageBase64, title);
                setShowSuccessOverlay(true);
            } catch (err) {
                console.error(err);
                setError(err.message || "Error al enviar el reporte por WhatsApp");
                setSendingWhatsApp(false);
            }
        },
        [accessToken, reportData, metasData]
    );

    const handleSuccessOverlayClose = () => {
        setShowSuccessOverlay(false);
        setSendingWhatsApp(false);
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

    const chartData = getChartData();
    const total = getTotal();

    return (
        <div className="text-black flex flex-col overflow-auto h-full">
            {error && (
                <Notification
                    color="red"
                    className="mb-4"
                    onClose={() => setError(null)}
                >
                    {error}
                </Notification>
            )}

            {successMessage && (
                <Notification
                    color="green"
                    className="mb-4"
                    onClose={() => setSuccessMessage(null)}
                >
                    {successMessage}
                </Notification>
            )}

            {/* ---------------- FILTROS ---------------- */}
            <div className="mb-4 flex-shrink-0">
                {/* Accordion para filtros en mobile */}
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
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <TextInput
                                        label="Fecha Final"
                                        type="date"
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
                                            {filtering ? (
                                                <Loader size="xs" color="white" />
                                            ) : (
                                                "Buscar"
                                            )}
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

                {/* Filtros en desktop */}
                <div className="hidden md:grid md:grid-cols-4 grid-cols-1 gap-2 items-end">
                    <TextInput
                        label="Fecha Inicial"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <TextInput
                        label="Fecha Final"
                        type="date"
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
            {reportData && chartData.length > 0 && (
                <div className="mb-4 flex-shrink-0">
                    <Accordion variant="contained" defaultValue="chart">
                        <Accordion.Item value="chart">
                            <Accordion.Control>
                                <div className="flex items-center gap-2">
                                    <RiBarChartBoxLine size={20} />
                                    <span className="font-bold">
                                        Gráfica de Ventas por Fecha
                                    </span>
                                </div>
                            </Accordion.Control>
                            <Accordion.Panel>
                                {/* Botones imagen y WhatsApp */}
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
                                        onClick={() => setShowDateModal(true)}
                                        variant="filled"
                                        color="green"
                                        leftSection={<RiWhatsappLine />}
                                        loading={sendingWhatsApp}
                                    >
                                        Enviar por WhatsApp
                                    </Button>
                                </div>

                                {/* Contenedor capturable */}
                                <div
                                    ref={chartSectionRef}
                                    id="chartSection"
                                    style={{
                                        backgroundColor: "#ffffff",
                                        padding: "32px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {/* Cards de resumen */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            gap: "16px",
                                            marginBottom: "24px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                backgroundColor: "#eff6ff",
                                                padding: "16px",
                                                borderRadius: "8px",
                                                borderLeft: "4px solid #3b82f6",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    backgroundColor: "#eff6ff",
                                                    color: "#6b7280",
                                                    textTransform: "uppercase",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                Total Ventas
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "bold",
                                                    backgroundColor: "#eff6ff",
                                                    color: "#2563eb",
                                                }}
                                            >
                                                {total.totalVentas}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                backgroundColor: "#f0fdf4",
                                                padding: "16px",
                                                borderRadius: "8px",
                                                borderLeft: "4px solid #22c55e",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    backgroundColor: "#f0fdf4",
                                                    color: "#6b7280",
                                                    textTransform: "uppercase",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                Meta de Ventas
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "bold",
                                                    backgroundColor: "#f0fdf4",
                                                    color: "#16a34a",
                                                }}
                                            >
                                                {total.totalMeta}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                backgroundColor: "#faf5ff",
                                                padding: "16px",
                                                borderRadius: "8px",
                                                borderLeft: "4px solid #a855f7",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    backgroundColor: "#faf5ff",
                                                    color: "#6b7280",
                                                    textTransform: "uppercase",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                Cumplimiento
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "bold",
                                                    backgroundColor: "#faf5ff",
                                                    color: "#9333ea",
                                                }}
                                            >
                                                {total.cumplimiento}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ComposedChart — extraído a sub-componente para evitar
                                        el error "Could not find Recharts context" en Next.js */}
                                    <VentasChart data={chartData} />

                                    {/* Tabla de datos debajo de la gráfica */}
                                    {(() => {
                                        // Agrupar por semana
                                        const groups = [];
                                        let curWeek = null;
                                        let buf = [];
                                        for (const item of chartData) {
                                            if (item.weekNum !== curWeek) {
                                                if (buf.length) groups.push({ weekNum: curWeek, items: buf });
                                                buf = [];
                                                curWeek = item.weekNum;
                                            }
                                            buf.push(item);
                                        }
                                        if (buf.length) groups.push({ weekNum: curWeek, items: buf });

                                        return (
                                            <div className="overflow-x-auto">
                                                <table className="table w-full text-xs border-collapse">
                                                    <thead>
                                                        {/* Fila de semanas */}
                                                        <tr className="bg-primary text-white">
                                                            <th className="border border-gray-300 px-4 py-2 text-center font-bold min-w-[80px]">
                                                                Día
                                                            </th>
                                                            {groups.map((g) => (
                                                                <th
                                                                    key={g.weekNum}
                                                                    colSpan={g.items.length}
                                                                    className="border border-gray-300 px-2 py-1 text-center font-bold"
                                                                >
                                                                    W{g.weekNum}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                        {/* Fila de labels de día */}
                                                        <tr className="bg-gray-100">
                                                            <th className="border border-gray-300 px-4 py-2 text-center font-bold min-w-[80px]" />
                                                            {chartData.map((item, idx) => (
                                                                <th
                                                                    key={idx}
                                                                    className="border border-gray-300 px-2 py-1 text-center font-bold whitespace-nowrap"
                                                                >
                                                                    {item.dia.substring(0, 3)}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-gray-50">
                                                            <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">
                                                                Fecha
                                                            </td>
                                                            {chartData.map((item, idx) => {
                                                                const [, m, d] = item.fecha.split("-");
                                                                return (
                                                                    <td key={idx} className="border border-gray-300 px-2 py-1 text-center text-xs">
                                                                        {d}/{m}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                        <tr className="bg-purple-50">
                                                            <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">
                                                                Meta
                                                            </td>
                                                            {chartData.map((item, idx) => (
                                                                <td key={idx} className="border border-gray-300 px-2 py-1 text-center">
                                                                    {item.meta}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                        <tr className="bg-blue-50">
                                                            <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">
                                                                Ventas
                                                            </td>
                                                            {chartData.map((item, idx) => (
                                                                <td key={idx} className="border border-gray-300 px-2 py-1 text-center">
                                                                    {item.ventas}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                        <tr className="bg-gray-50">
                                                            <td className="border border-gray-300 px-4 py-2 font-bold text-center whitespace-nowrap">
                                                                % Cumpl.
                                                            </td>
                                                            {chartData.map((item, idx) => (
                                                                <td key={idx} className="border border-gray-300 px-2 py-1 text-center font-semibold">
                                                                    {item.cumplimiento}%
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </div>
            )}

            {/* ---------------- TABLA PRINCIPAL ---------------- */}
            <div className="flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : reportData && chartData.length > 0 ? (
                    <>
                        {/* Vista Desktop */}
                        <div className="hidden md:block rounded-md">
                            <table className="table w-full">
                                <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                                    <tr>
                                        <th>Semana</th>
                                        <th>Día</th>
                                        <th>Fecha</th>
                                        <th>Ventas</th>
                                        <th>Meta</th>
                                        <th>Cumplimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-black">
                                    {(() => {
                                        const rows = [];
                                        let currentWeek = null;
                                        let weekItems = [];
                                        const groups = [];
                                        for (const item of chartData) {
                                            if (item.weekNum !== currentWeek) {
                                                if (weekItems.length) groups.push({ weekNum: currentWeek, items: weekItems });
                                                weekItems = [];
                                                currentWeek = item.weekNum;
                                            }
                                            weekItems.push(item);
                                        }
                                        if (weekItems.length) groups.push({ weekNum: currentWeek, items: weekItems });

                                        groups.forEach((group) => {
                                            group.items.forEach((item, idx) => {
                                                rows.push(
                                                    <tr key={item.fecha} className="hover:bg-gray-100">
                                                        {idx === 0 && (
                                                            <td
                                                                rowSpan={group.items.length}
                                                                className="font-bold text-center bg-gray-50 border-r border-gray-200"
                                                            >
                                                                W{group.weekNum}
                                                            </td>
                                                        )}
                                                        <td className="font-bold uppercase">{item.dia}</td>
                                                        <td>{item.fecha}</td>
                                                        <td className="font-semibold text-blue-600">{item.ventas}</td>
                                                        <td className="font-semibold text-green-600">{item.meta || "—"}</td>
                                                        <td className="font-bold text-purple-600">
                                                            {item.meta > 0 ? `${item.cumplimiento}%` : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        });
                                        return rows;
                                    })()}
                                </tbody>
                                <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                                    <tr>
                                        <td colSpan={3} className="text-center uppercase">
                                            Total
                                        </td>
                                        <td className="text-blue-600">{total.totalVentas}</td>
                                        <td className="text-green-600">{total.totalMeta || "—"}</td>
                                        <td className="text-purple-600">{total.cumplimiento}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Vista Móvil */}
                        <div className="md:hidden block space-y-6">
                            {(() => {
                                const groups = [];
                                let currentWeek = null;
                                let weekItems = [];
                                for (const item of chartData) {
                                    if (item.weekNum !== currentWeek) {
                                        if (weekItems.length) groups.push({ weekNum: currentWeek, items: weekItems });
                                        weekItems = [];
                                        currentWeek = item.weekNum;
                                    }
                                    weekItems.push(item);
                                }
                                if (weekItems.length) groups.push({ weekNum: currentWeek, items: weekItems });

                                return groups.map((group) => (
                                    <div key={group.weekNum}>
                                        <h3 className="text-lg font-bold mb-3 uppercase">
                                            Semana {group.weekNum}
                                        </h3>
                                        <div className="space-y-4">
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.fecha}
                                                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                                                >
                                                    <div className="mb-2 font-bold text-lg uppercase">
                                                        {item.dia} — {item.fecha}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="mb-1 font-semibold text-gray-600">Ventas:</div>
                                                            <div className="text-xl font-bold text-blue-600">{item.ventas}</div>
                                                        </div>
                                                        <div>
                                                            <div className="mb-1 font-semibold text-gray-600">Meta:</div>
                                                            <div className="text-xl font-bold text-green-600">{item.meta || "—"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <div className="mb-1 font-semibold text-gray-600">Cumplimiento:</div>
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {item.meta > 0 ? `${item.cumplimiento}%` : "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </>
                ) : (
                    !loading && (
                        <div className="text-center py-8">
                            No se encontraron datos para el rango seleccionado.
                        </div>
                    )
                )}
            </div>

            {/* Modal de selección de fecha para WhatsApp */}
            <Modal
                opened={showDateModal}
                onClose={() => setShowDateModal(false)}
                title="Selecciona el día del reporte"
                centered
                size="lg"
            >
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-4">
                        Selecciona la fecha para la cual deseas enviar el reporte
                        por WhatsApp:
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
                                    <span className="text-gray-500">{item.dia}</span>
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
