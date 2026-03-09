"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Button,
    Loader,
    Notification,
    Select,
    Accordion,
    TextInput,
    Badge,
    Group,
} from "@mantine/core";
import {
    RiSearchLine,
    RiCloseCircleLine,
    RiDownloadCloudLine,
    RiRefreshLine,
    RiImageLine,
    RiWhatsappLine,
    RiAddLine,
    RiDeleteBinLine,
    RiCloseLine,
    RiCalendarLine,
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import {
    getSkuMetricsReport,
    getSpecialItemsLegacy,
    downloadSpecialItemsLegacy,
    searchHomologatedProducts,
} from "@/tada/services/ventasHistoricasApi";
import {
    generateChartImage,
    generateChartImageBase64,
} from "@/tada/services/salesImageGeneratorService";
import { sendReportToWhatsApp } from "@/tada/services/salesReportApi";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LabelList,
    ResponsiveContainer,
} from "recharts";

const PERMISSION_PATH = "/dashboard/sales/data-historica/sku-comparativa";

const MONTH_LABELS = [
    "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// Colores para barras de SKU
const SKU_COLORS = [
    "#3b82f6", "#f59e0b", "#10b981", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

// Colores para las barras In&Out (una por producto In&Out)
const LEGACY_COLORS = ["#6b7280", "#4b5563", "#9ca3af", "#374151", "#1f2937", "#d1d5db"];

// Detectar si una clave es una fecha YYYY-MM-DD
const isDateKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);
// Detectar si una clave es una fecha MM-DD
const isMdKey = (k) => /^\d{2}-\d{2}$/.test(k);
// Normalizar cualquier fecha a MM-DD (funciona con YYYY-MM-DD y MM-DD)
const toMdKey = (k) => (isDateKey(k) ? k.slice(5) : k);

export default function SkuComparativaPage() {
    const { accessToken, user } = useAuth();

    const tableSectionRef = useRef(null);

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useEffect(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user]);

    /* ------------------- BÚSQUEDA DE SKU ------------------- */
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [skuSearchTerm, setSkuSearchTerm] = useState("");
    const [skuSearchResults, setSkuSearchResults] = useState([]);
    const [searchingSku, setSearchingSku] = useState(false);

    const handleSearchSku = async () => {
        if (!skuSearchTerm.trim()) {
            setSkuSearchResults([]);
            return;
        }
        setSearchingSku(true);
        try {
            const results = await searchHomologatedProducts(accessToken, skuSearchTerm);
            const selectedNames = selectedSkus.map((s) => s.name);
            setSkuSearchResults(results.filter((r) => !selectedNames.includes(r.name)));
        } catch (err) {
            console.error(err);
            setError("Error al buscar productos homologados");
        } finally {
            setSearchingSku(false);
        }
    };

    const handleSelectSku = (sku) => {
        if (selectedSkus.some((s) => s.name === sku.name)) {
            setError("Este producto ya está seleccionado");
            setTimeout(() => setError(null), 3000);
            return;
        }
        setSelectedSkus((prev) => [...prev, sku]);
        setSkuSearchTerm("");
        setSkuSearchResults([]);
    };

    const handleRemoveSku = (name) =>
        setSelectedSkus((prev) => prev.filter((s) => s.name !== name));

    const handleClearAllSkus = () => {
        setSelectedSkus([]);
        setSkuSearchTerm("");
        setSkuSearchResults([]);
    };

    /* ------------------- FILTROS ------------------- */
    const getYearStart = () => `${new Date().getFullYear()}-01-01`;
    const getYearEnd = () => `${new Date().getFullYear()}-12-31`;

    const [startDate, setStartDate] = useState(getYearStart());
    const [endDate, setEndDate] = useState(getYearEnd());
    const [reportType, setReportType] = useState("hectolitros");
    const [filtering, setFiltering] = useState(false);

    const [appliedFilters, setAppliedFilters] = useState({
        selectedSkus: [],
        startDate: getYearStart(),
        endDate: getYearEnd(),
        reportType: "hectolitros",
    });

    /* ------------------- DATOS ------------------- */
    const [skuData, setSkuData] = useState(null);
    const [legacyData, setLegacyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadingImage, setDownloadingImage] = useState(false);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    // { [prodName]: "2023" | "2024" | ... } — año seleccionado por columna In&Out
    const [legacyYearSelections, setLegacyYearSelections] = useState({});

    // Ordenamiento de la tabla
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const handleSort = (key) =>
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));

    // Agrupación mensual en la tabla
    const [groupByMonth, setGroupByMonth] = useState(false);

    /* =========================================================
       Traer reporte SKU + In&Out en paralelo
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!appliedFilters.selectedSkus.length) {
            setSkuData(null);
            setLegacyData(null);
            return;
        }

        setLoading(true);
        try {
            const skuCodes = appliedFilters.selectedSkus.flatMap((s) => s.codes).join(",");

            // Derivar MM-DD para el endpoint In&Out (acepta rangos multi-año)
            const startMd = appliedFilters.startDate.slice(5); // "YYYY-MM-DD" → "MM-DD"
            const endMd = appliedFilters.endDate.slice(5);

            // Llamadas en paralelo; si el SKU no tiene datos el endpoint lanza error
            // → lo capturamos individualmente para que el legacy siga funcionando.
            const [skuResult, legacyResponse] = await Promise.all([
                getSkuMetricsReport(
                    accessToken,
                    skuCodes,
                    appliedFilters.startDate,
                    appliedFilters.endDate,
                    appliedFilters.reportType,
                    true // dates=true → retorna datos por fecha
                ).catch((err) => {
                    console.warn("[SKU Comparativa] Sin métricas para el SKU:", err.message);
                    return { skus: {} }; // vacío → se crearán placeholders con 0
                }),
                getSpecialItemsLegacy(
                    accessToken,
                    startMd,
                    endMd
                ),
            ]);
            const skuResponse = skuResult;

            // Procesar SKU: extraer totales por fecha → normalizar a MM-DD
            const processedSku = {};
            if (skuResponse.skus) {
                Object.entries(skuResponse.skus).forEach(([productName, data]) => {
                    const dateData = { total: data.total || 0 };
                    Object.keys(data).forEach((k) => {
                        if (isDateKey(k)) dateData[toMdKey(k)] = data[k];
                    });
                    processedSku[productName] = {
                        ...dateData,
                        sku_codes: data.sku_codes,
                        product_name: data.product_name,
                        homologated: data.homologated,
                    };
                });
            }

            console.log("[SKU Comparativa] Legacy (In&Out) response:", legacyResponse);

            // Si no venían métricas de SKU, crear entradas placeholder con 0
            // para que la tabla se muestre igual con los datos de In&Out.
            if (Object.keys(processedSku).length === 0) {
                appliedFilters.selectedSkus.forEach((sku) => {
                    processedSku[sku.name] = {
                        total: 0,
                        sku_codes: sku.codes,
                        product_name: sku.name,
                        homologated: sku.homologated,
                    };
                });
            }

            setSkuData(processedSku);
            setLegacyData(legacyResponse);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al cargar el reporte");
            setSkuData(null);
            setLegacyData(null);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, accessToken]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Cuando llegan datos legacy, inicializar cada producto al año más reciente
    useEffect(() => {
        if (!legacyData?.results) return;
        setLegacyYearSelections((prev) => {
            const next = { ...prev };
            Object.entries(legacyData.results).forEach(([prodName, prodData]) => {
                if (next[prodName]) return; // ya tiene selección
                const years = [
                    ...new Set((prodData.records || []).map((r) => r.fecha.slice(0, 4))),
                ].sort();
                if (years.length > 0) next[prodName] = years[years.length - 1];
            });
            return next;
        });
    }, [legacyData]);

    /* =========================================================
       Handlers de filtros
    ========================================================= */
    const applyFilters = async () => {
        if (!selectedSkus.length) {
            setError("Debes seleccionar al menos un SKU");
            return;
        }
        setFiltering(true);
        try {
            setAppliedFilters({ selectedSkus, startDate, endDate, reportType });
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setSelectedSkus([]);
            setSkuSearchTerm("");
            setSkuSearchResults([]);
            setStartDate(getYearStart());
            setEndDate(getYearEnd());
            setReportType("hectolitros");
            setAppliedFilters({
                selectedSkus: [],
                startDate: getYearStart(),
                endDate: getYearEnd(),
                reportType: "hectolitros",
            });
            setSkuData(null);
            setLegacyData(null);
        } finally {
            setFiltering(false);
        }
    };

    /* =========================================================
       Descargas
    ========================================================= */
    const handleDownloadLegacy = async () => {
        setDownloading(true);
        try {
            const startMd = appliedFilters.startDate.slice(5);
            const endMd = appliedFilters.endDate.slice(5);
            await downloadSpecialItemsLegacy(
                accessToken,
                startMd,
                endMd
            );
            setSuccessMessage("Descarga de In&Out iniciada");
        } catch (err) {
            setError(err.message || "Error al descargar el archivo In&Out");
        } finally {
            setDownloading(false);
        }
    };

    const downloadTableImage = useCallback(async () => {
        if (!tableSectionRef.current) return;
        setDownloadingImage(true);
        try {
            await generateChartImage(tableSectionRef.current, {
                filename: `sku_comparativa_tabla_${appliedFilters.startDate}_${appliedFilters.endDate}.png`,
                sectionId: "tableSection",
                width: 1600,
                scale: 2,
                padding: "40px 60px",
                hideSelectors: [".md\\:hidden", "[class*='md:hidden']", "#chartSection"],
            });
            setSuccessMessage("Imagen de tabla descargada exitosamente");
        } catch (err) {
            console.error(err);
            setError("Error al descargar la imagen de la tabla.");
        } finally {
            setDownloadingImage(false);
        }
    }, [appliedFilters]);

    const sendTableToWhatsApp = useCallback(async () => {
        if (!tableSectionRef.current) return;
        setSendingWhatsApp(true);
        try {
            const imageBase64 = await generateChartImageBase64(tableSectionRef.current, {
                sectionId: "tableSection",
                width: 1600,
                scale: 2,
                padding: "40px 60px",
                hideSelectors: [".md\\:hidden", "[class*='md:hidden']", "#chartSection"],
            });
            const title = `Comparativa SKU vs In&Out — ${appliedFilters.startDate} / ${appliedFilters.endDate}`;
            await sendReportToWhatsApp(accessToken, imageBase64, title);
            setShowSuccessOverlay(true);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al enviar el reporte por WhatsApp");
            setSendingWhatsApp(false);
        }
    }, [accessToken, appliedFilters]);

    const handleSuccessOverlayClose = () => {
        setShowSuccessOverlay(false);
        setSendingWhatsApp(false);
    };

    /* =========================================================
       Helpers de datos
    ========================================================= */

    /** Años disponibles para un producto In&Out, ordenados ascendente */
    const getYearsForProduct = (prodName) => [
        ...new Set(
            (legacyData?.results?.[prodName]?.records || []).map((r) => r.fecha.slice(0, 4))
        ),
    ].sort();

    /** Unión de todas las fechas presentes en skuData y legacyData (año filtrado), normalizadas a MM-DD y ordenadas */
    const getDates = () => {
        const dates = new Set();
        if (skuData) {
            Object.values(skuData).forEach((d) =>
                Object.keys(d).forEach((k) => {
                    if (isMdKey(k)) dates.add(k);
                })
            );
        }
        if (legacyData?.results && typeof legacyData.results === "object") {
            Object.entries(legacyData.results).forEach(([prodName, prodData]) => {
                const yr = legacyYearSelections[prodName];
                (prodData.records || []).forEach((r) => {
                    if (!yr || r.fecha.startsWith(yr)) dates.add(toMdKey(r.fecha));
                });
            });
        }
        return Array.from(dates).sort();
    };

    /**
     * Agrupación de In&Out por producto y fecha.
     * Retorna { productName: { fecha: value } }
     */
    const getLegacyByDate = () => {
        if (!legacyData?.results || typeof legacyData.results !== "object") return {};
        const field = appliedFilters.reportType === "hectolitros" ? "hectolitros" : "cajas";
        const result = {};
        Object.entries(legacyData.results).forEach(([prodName, prodData]) => {
            result[prodName] = {};
            const yr = legacyYearSelections[prodName];
            (prodData.records || []).forEach((item) => {
                if (yr && !item.fecha.startsWith(yr)) return; // filtrar por año
                const key = toMdKey(item.fecha); // normalizar a MM-DD
                result[prodName][key] =
                    (result[prodName][key] || 0) + parseFloat(item[field] || 0);
            });
        });
        return result;
    };

    /**
     * Totales por producto In&Out.
     * Retorna { productName: total }
     */
    const getLegacyTotal = (legacyByDate) => {
        const totals = {};
        Object.entries(legacyByDate).forEach(([prodName, byDate]) => {
            totals[prodName] = Object.values(byDate).reduce((a, b) => a + b, 0);
        });
        return totals;
    };

    /* =========================================================
       Render tabla de comparativa por SKU
    ========================================================= */
    const renderComparisonTable = () => {
        if (!skuData) return null;

        const SortTh = ({ colKey, children, className = "text-center" }) => (
            <th
                className={`${className} cursor-pointer select-none hover:bg-white/10`}
                onClick={() => handleSort(colKey)}
            >
                <span className="inline-flex items-center gap-1 justify-center">
                    {children}
                    <span className="inline-flex flex-col leading-[0.6] text-[10px]">
                        <span className={sortConfig.key === colKey && sortConfig.direction === "asc" ? "opacity-100" : "opacity-30"}>▲</span>
                        <span className={sortConfig.key === colKey && sortConfig.direction === "desc" ? "opacity-100" : "opacity-30"}>▼</span>
                    </span>
                </span>
            </th>
        );

        const dates = getDates();
        const legacyByDate = getLegacyByDate(); // { prodName: { fecha: val } }
        const legacyProductTotals = getLegacyTotal(legacyByDate); // { prodName: total }
        const legacyProducts = Object.keys(legacyByDate);
        // Suma combinada de todos los productos In&Out por fecha
        const legacyCombinedByDate = {};
        dates.forEach((date) => {
            legacyCombinedByDate[date] = legacyProducts.reduce(
                (sum, prod) => sum + (legacyByDate[prod]?.[date] || 0),
                0
            );
        });
        const legacyGrandTotal = Object.values(legacyProductTotals).reduce((a, b) => a + b, 0);
        const label = appliedFilters.reportType === "hectolitros" ? "HL" : "Cajas";

        return (
            <>
                {Object.entries(skuData).map(([productName, data], idx) => {
                    const skuTotal = data.total || 0;
                    const diff = skuTotal - legacyGrandTotal;
                    const pct =
                        legacyGrandTotal !== 0
                            ? ((skuTotal - legacyGrandTotal) / legacyGrandTotal) * 100
                            : null;
                    const skuColor = SKU_COLORS[idx % SKU_COLORS.length];

                    const getSortedDates = () => {
                        if (!sortConfig.key) return dates;
                        return [...dates].sort((a, b) => {
                            let aVal, bVal;
                            if (sortConfig.key === "date") {
                                aVal = a; bVal = b;
                            } else if (sortConfig.key === "__sku__") {
                                aVal = data[a] || 0; bVal = data[b] || 0;
                            } else if (sortConfig.key === "__combined__") {
                                aVal = legacyCombinedByDate[a] || 0;
                                bVal = legacyCombinedByDate[b] || 0;
                            } else if (sortConfig.key === "__diff__") {
                                aVal = (data[a] || 0) - (legacyCombinedByDate[a] || 0);
                                bVal = (data[b] || 0) - (legacyCombinedByDate[b] || 0);
                            } else if (sortConfig.key === "__pct__") {
                                const la = legacyCombinedByDate[a] || 0;
                                const lb = legacyCombinedByDate[b] || 0;
                                aVal = la !== 0 ? ((data[a] || 0) - la) / la * 100 : -Infinity;
                                bVal = lb !== 0 ? ((data[b] || 0) - lb) / lb * 100 : -Infinity;
                            } else {
                                aVal = legacyByDate[sortConfig.key]?.[a] || 0;
                                bVal = legacyByDate[sortConfig.key]?.[b] || 0;
                            }
                            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                            return 0;
                        });
                    };
                    const sortedDates = getSortedDates();

                    // Filas unificadas (diarias o agrupadas por mes)
                    const displayRows = groupByMonth
                        ? (() => {
                            const rows = [];
                            for (let m = 1; m <= 12; m++) {
                                const mm = String(m).padStart(2, "0");
                                const matchingDates = dates.filter((d) => d.startsWith(mm + "-"));
                                if (matchingDates.length === 0) continue;
                                const skuVal = matchingDates.reduce((s, d) => s + (data[d] || 0), 0);
                                const legByProd = {};
                                legacyProducts.forEach((lp) => {
                                    legByProd[lp] = matchingDates.reduce(
                                        (s, d) => s + (legacyByDate[lp]?.[d] || 0), 0
                                    );
                                });
                                const totalLegVal = legacyProducts.reduce(
                                    (s, lp) => s + (legByProd[lp] || 0), 0
                                );
                                rows.push({ key: mm, label: MONTH_LABELS[m], skuVal, legByProd, totalLegVal });
                            }
                            if (sortConfig.key) {
                                rows.sort((a, b) => {
                                    let aVal, bVal;
                                    if (sortConfig.key === "date") { aVal = a.key; bVal = b.key; }
                                    else if (sortConfig.key === "__sku__") { aVal = a.skuVal; bVal = b.skuVal; }
                                    else if (sortConfig.key === "__combined__") { aVal = a.totalLegVal; bVal = b.totalLegVal; }
                                    else if (sortConfig.key === "__diff__") { aVal = a.skuVal - a.totalLegVal; bVal = b.skuVal - b.totalLegVal; }
                                    else if (sortConfig.key === "__pct__") {
                                        aVal = a.totalLegVal !== 0 ? (a.skuVal - a.totalLegVal) / a.totalLegVal * 100 : -Infinity;
                                        bVal = b.totalLegVal !== 0 ? (b.skuVal - b.totalLegVal) / b.totalLegVal * 100 : -Infinity;
                                    } else {
                                        aVal = a.legByProd[sortConfig.key] || 0;
                                        bVal = b.legByProd[sortConfig.key] || 0;
                                    }
                                    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                                    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                                    return 0;
                                });
                            }
                            return rows;
                        })()
                        : sortedDates.map((date) => {
                            const skuVal = data[date] || 0;
                            const legByProd = {};
                            legacyProducts.forEach((lp) => {
                                legByProd[lp] = legacyByDate[lp]?.[date] || 0;
                            });
                            const totalLegVal = legacyCombinedByDate[date] || 0;
                            return { key: date, label: date, skuVal, legByProd, totalLegVal };
                        });

                    return (
                        <div key={productName} className="mb-8 last:mb-0">
                            {/* Encabezado del SKU */}
                            <div className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-md bg-purple-100 sticky top-0 z-20">
                                <h2 className="text-xl font-bold uppercase">
                                    {data.product_name || productName}
                                </h2>
                                {data.homologated !== undefined && (
                                    <Badge
                                        size="lg"
                                        variant="filled"
                                        color={data.homologated ? "green" : "gray"}
                                    >
                                        {data.homologated ? "✓ Homologado" : "No Homologado"}
                                    </Badge>
                                )}
                                {data.sku_codes?.length > 0 && (
                                    <span className="text-sm text-gray-700 font-normal bg-white px-3 py-1 rounded-full">
                                        Códigos: {data.sku_codes.join(", ")}
                                    </span>
                                )}
                            </div>

                            {/* Gráfica mensual agrupada */}
                            {(() => {
                                // Agrupar por mes (MM) sumando todos los días
                                const monthlyMap = {};
                                for (let m = 1; m <= 12; m++) {
                                    const mm = String(m).padStart(2, "0");
                                    const entry = { month: MONTH_LABELS[m] };
                                    // SKU
                                    entry[data.product_name || productName] = dates
                                        .filter((d) => d.startsWith(mm + "-"))
                                        .reduce((s, d) => s + (data[d] || 0), 0);
                                    // Legacy products
                                    legacyProducts.forEach((legProd) => {
                                        entry[`In&Out: ${legProd}`] = dates
                                        .filter((d) => d.startsWith(mm + "-"))
                                        .reduce((s, d) => s + (legacyByDate[legProd]?.[d] || 0), 0);
                                    });
                                    monthlyMap[mm] = entry;
                                }
                                const skuKey = data.product_name || productName;
                                // Construir el array en orden 1-12 explícitamente (evita que
                                // "10","11","12" sean tratados como índices enteros y aparezcan
                                // primero al usar Object.values), luego ordenar de mayor a menor
                                // según el valor del SKU.
                                const monthlyData = Array.from(
                                    { length: 12 },
                                    (_, i) => monthlyMap[String(i + 1).padStart(2, "0")]
                                ).sort((a, b) => b[skuKey] - a[skuKey]);

                                const CustomTooltip = ({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-[180px]">
                                            <p className="font-bold mb-2 text-gray-800 text-sm">{label}</p>
                                            {payload.map((e) => (
                                                <div key={e.dataKey} className="flex justify-between gap-3 text-xs">
                                                    <span style={{ color: e.fill }}>● {e.name}</span>
                                                    <span className="font-bold">{Number(e.value).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                };

                                const legendItems = [
                                    { name: skuKey, color: skuColor },
                                    ...legacyProducts.map((lp, lIdx) => ({
                                        name: `In&Out: ${lp}`,
                                        color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length],
                                    })),
                                ];

                                return (
                                    <div className="mb-4 bg-white rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 text-center">
                                            {skuKey} — comparativa mensual ({label})
                                        </h3>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1 min-w-0">
                                                <ResponsiveContainer width="100%" height={500}>
                                                    <BarChart data={monthlyData} margin={{ top: 24, right: 8, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                        <YAxis tick={{ fontSize: 11 }} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Bar dataKey={skuKey} fill={skuColor} name={skuKey} radius={[3,3,0,0]}>
                                                            <LabelList
                                                                dataKey={skuKey}
                                                                position="top"
                                                                formatter={(v) => (v > 0 ? v.toFixed(1) : "")}
                                                                style={{ fontSize: 9, fill: "#374151" }}
                                                            />
                                                        </Bar>
                                                        {legacyProducts.map((legProd, lIdx) => (
                                                            <Bar
                                                                key={legProd}
                                                                dataKey={`In&Out: ${legProd}`}
                                                                fill={LEGACY_COLORS[lIdx % LEGACY_COLORS.length]}
                                                                name={`In&Out: ${legProd}`}
                                                                radius={[3,3,0,0]}
                                                            >
                                                                <LabelList
                                                                    dataKey={`In&Out: ${legProd}`}
                                                                    position="top"
                                                                    formatter={(v) => (v > 0 ? v.toFixed(1) : "")}
                                                                    style={{ fontSize: 9, fill: "#374151" }}
                                                                />
                                                            </Bar>
                                                        ))}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex-shrink-0 flex flex-col gap-2 max-w-[200px]">
                                                {legendItems.map((item) => (
                                                    <div key={item.name} className="flex items-center gap-2 text-xs text-gray-700">
                                                        <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                        <span className="leading-tight">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Toggle agrupación */}
                            <div className="flex justify-end mb-2">
                                <Button
                                    onClick={() => setGroupByMonth((v) => !v)}
                                    variant={groupByMonth ? "filled" : "outline"}
                                    color="indigo"
                                    size="xs"
                                    leftSection={<RiCalendarLine />}
                                >
                                    {groupByMonth ? "Ver por Fecha" : "Ver por Mes"}
                                </Button>
                            </div>

                            {/* Tabla Desktop */}
                            <div className="hidden md:block overflow-auto rounded-md">
                                <table className="table w-full text-sm">
                                    <thead className="bg-primary text-white text-xs uppercase font-bold sticky top-0 z-10">
                                        <tr>
                                            <SortTh colKey="date" className="text-left">Fecha</SortTh>
                                            <SortTh colKey="__sku__">
                                                {data.product_name || productName} ({label})
                                            </SortTh>
                                            {legacyProducts.map((legProd) => {
                                                const availableYears = getYearsForProduct(legProd);
                                                const selectedYear = legacyYearSelections[legProd] || "";
                                                return (
                                                    <SortTh key={legProd} colKey={legProd}>
                                                        <span className="flex flex-col items-center gap-0.5">
                                                            <span>{legProd} ({label})</span>
                                                            {availableYears.length > 1 ? (
                                                                <select
                                                                    value={selectedYear}
                                                                    onChange={(e) =>
                                                                        setLegacyYearSelections((prev) => ({
                                                                            ...prev,
                                                                            [legProd]: e.target.value,
                                                                        }))
                                                                    }
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-xs font-normal normal-case bg-white text-gray-800 border border-gray-300 rounded px-1 py-0.5 cursor-pointer"
                                                                >
                                                                    {availableYears.map((yr) => (
                                                                        <option key={yr} value={yr}>{yr}</option>
                                                                    ))}
                                                                </select>
                                                            ) : availableYears.length === 1 ? (
                                                                <span className="text-xs font-normal normal-case opacity-75">({availableYears[0]})</span>
                                                            ) : null}
                                                        </span>
                                                    </SortTh>
                                                );
                                            })}
                                            <SortTh colKey="__pct__">Var. %</SortTh>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-black">
                                        {displayRows.map(({ key, label, skuVal, legByProd, totalLegVal }) => {
                                            const d = skuVal - totalLegVal;
                                            const p =
                                                totalLegVal !== 0
                                                    ? ((skuVal - totalLegVal) / totalLegVal) * 100
                                                    : null;
                                            return (
                                                <tr key={key} className="hover:bg-gray-50">
                                                    <td className="font-mono text-xs">{label}</td>
                                                    <td className="text-center font-semibold" style={{ color: skuColor }}>
                                                        {skuVal > 0 ? skuVal.toFixed(2) : <span className="text-gray-400">0.00</span>}
                                                    </td>
                                                    {legacyProducts.map((legProd, lIdx) => {
                                                        const lv = legByProd[legProd] || 0;
                                                        return (
                                                            <td
                                                                key={legProd}
                                                                className="text-center"
                                                                style={{ color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length] }}
                                                            >
                                                                {lv.toFixed(2)}
                                                            </td>
                                                        );
                                                    })}
                                                    {legacyProducts.length > 1 && (
                                                        <td className="text-center font-semibold text-gray-700">
                                                            {totalLegVal.toFixed(2)}
                                                        </td>
                                                    )}
                                                    <td
                                                        className={`text-center font-semibold ${
                                                            d > 0 ? "text-green-600" : d < 0 ? "text-red-600" : "text-gray-400"
                                                        }`}
                                                    >
                                                        {(d > 0 ? "+" : "") + d.toFixed(2)}
                                                    </td>
                                                    <td
                                                        className={`text-center ${
                                                            p === null ? "text-gray-400" : p >= 0 ? "text-green-600" : "text-red-600"
                                                        }`}
                                                    >
                                                        {p !== null ? `${p >= 0 ? "+" : ""}${p.toFixed(1)}%` : "—"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                                        <tr>
                                            <td className="uppercase text-center">Total</td>
                                            <td className="text-center" style={{ color: skuColor }}>
                                                {skuTotal.toFixed(2)}
                                            </td>
                                            {legacyProducts.map((legProd, lIdx) => (
                                                <td
                                                    key={legProd}
                                                    className="text-center"
                                                    style={{ color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length] }}
                                                >
                                                    {(legacyProductTotals[legProd] || 0).toFixed(2)}
                                                </td>
                                            ))}
                                            <td className={`text-center ${pct === null ? "text-gray-400" : pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Tabla Móvil */}
                            <div className="md:hidden space-y-2">
                                {displayRows.map(({ key, label, skuVal, legByProd, totalLegVal }) => {
                                    const p =
                                        totalLegVal !== 0
                                            ? ((skuVal - totalLegVal) / totalLegVal) * 100
                                            : null;
                                    return (
                                        <div key={key} className="bg-white border rounded-lg p-3">
                                            <div className="font-mono text-xs font-bold text-gray-600 mb-2">{label}</div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-xs text-gray-500">SKU: </span>
                                                    <span className="font-bold" style={{ color: skuColor }}>
                                                        {skuVal.toFixed(2)}
                                                    </span>
                                                </div>
                                                {legacyProducts.map((legProd, lIdx) => (
                                                    <div key={legProd}>
                                                        <span className="text-xs text-gray-500">{legProd}: </span>
                                                        <span
                                                            className="font-bold"
                                                            style={{ color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length] }}
                                                        >
                                                            {(legByProd[legProd] || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {p !== null && (
                                                    <div>
                                                        <span className="text-xs text-gray-500">Var: </span>
                                                        <span className={`font-bold ${p >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                            {(p >= 0 ? "+" : "") + p.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Total móvil */}
                                <div className="bg-yellow-100 border-2 border-yellow-300 p-4 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                                        <div>
                                            SKU Total:{" "}
                                            <span style={{ color: skuColor }}>{skuTotal.toFixed(2)}</span>
                                        </div>
                                        {legacyProducts.map((legProd, lIdx) => (
                                            <div key={legProd}>
                                                {legProd}:{" "}
                                                <span style={{ color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length] }}>
                                                    {(legacyProductTotals[legProd] || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        {pct !== null && (
                                            <div className={pct >= 0 ? "text-green-700" : "text-red-700"}>
                                                Var: {(pct >= 0 ? "+" : "") + pct.toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    /* =========================================================
       Guard de autorización
    ========================================================= */
    if (authorized === null) {
        return (
            <div className="flex justify-center items-center mt-64">
                <Loader size="lg" />
            </div>
        );
    }
    if (!authorized) return <Unauthorized />;

    const hasData = skuData && Object.keys(skuData).length > 0;

    return (
        <div className="text-black h-full flex flex-col">
            {error && (
                <Notification color="red" className="mb-4" onClose={() => setError(null)}>
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

            <h1 className="text-2xl font-bold mb-4">
                Comparativa SKU vs In&Out
            </h1>

            {/* ---- Acciones ---- */}
            <div className="mb-4 flex-shrink-0">
                <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                        onClick={handleDownloadLegacy}
                        variant="filled"
                        color="teal"
                        leftSection={<RiDownloadCloudLine />}
                        loading={downloading}
                        className="flex-1 md:flex-none"
                    >
                        Descargar In&Out Excel
                    </Button>
                    <Button
                        onClick={downloadTableImage}
                        variant="outline"
                        color="violet"
                        leftSection={<RiImageLine />}
                        loading={downloadingImage}
                        disabled={!hasData || loading}
                        className="flex-1 md:flex-none"
                    >
                        Descargar Tabla
                    </Button>
                    <Button
                        onClick={sendTableToWhatsApp}
                        variant="filled"
                        color="green"
                        leftSection={<RiWhatsappLine />}
                        loading={sendingWhatsApp}
                        disabled={!hasData || loading}
                        className="flex-1 md:flex-none"
                    >
                        Enviar por WhatsApp
                    </Button>
                </div>

                {/* Filtros móvil */}
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
                                            disabled={
                                                loading || filtering || selectedSkus.length === 0
                                            }
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
                                        disabled={
                                            loading ||
                                            filtering ||
                                            !appliedFilters.selectedSkus.length
                                        }
                                        fullWidth
                                    >
                                        Refrescar
                                    </Button>
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </div>

                {/* Filtros desktop */}
                <div className="hidden md:block">
                    <div className="grid md:grid-cols-5 grid-cols-1 gap-2 items-end">
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
                            disabled={loading || filtering || selectedSkus.length === 0}
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
            </div>

            {/* ---- Buscador de SKU ---- */}
            <div className="mb-4 flex-shrink-0">
                {selectedSkus.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-blue-900">
                                SKUs Seleccionados ({selectedSkus.length})
                            </span>
                            <Button
                                size="xs"
                                color="red"
                                variant="light"
                                onClick={handleClearAllSkus}
                                leftSection={<RiDeleteBinLine />}
                            >
                                Limpiar Todos
                            </Button>
                        </div>
                        <Group gap="xs">
                            {selectedSkus.map((sku) => (
                                <Badge
                                    key={sku.name}
                                    size="lg"
                                    variant="filled"
                                    color={sku.homologated ? "green" : "blue"}
                                    rightSection={
                                        <RiCloseLine
                                            className="cursor-pointer"
                                            onClick={() => handleRemoveSku(sku.name)}
                                            size={16}
                                        />
                                    }
                                    style={{ paddingRight: 4 }}
                                >
                                    {sku.name} {sku.homologated && "✓"}
                                </Badge>
                            ))}
                        </Group>
                    </div>
                )}

                <label className="text-sm font-medium mb-2 block">
                    Buscar SKU{" "}
                    {selectedSkus.length > 0 && `(${selectedSkus.length} seleccionados)`}
                </label>
                <div className="flex gap-2">
                    <TextInput
                        placeholder="Buscar por nombre o código de SKU..."
                        value={skuSearchTerm}
                        onChange={(e) => setSkuSearchTerm(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearchSku();
                        }}
                        className="flex-1"
                        leftSection={<RiSearchLine />}
                    />
                    <Button
                        onClick={handleSearchSku}
                        loading={searchingSku}
                        leftSection={<RiSearchLine />}
                    >
                        Buscar
                    </Button>
                </div>

                {skuSearchResults.length > 0 && (
                    <div className="mt-3 border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                        {skuSearchResults.map((sku, index) => (
                            <div
                                key={`${sku.name}-${index}`}
                                className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center cursor-pointer"
                                onClick={() => handleSelectSku(sku)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold text-sm">{sku.name}</div>
                                        <Badge
                                            size="sm"
                                            variant="filled"
                                            color={sku.homologated ? "green" : "gray"}
                                        >
                                            {sku.homologated ? "Homologado" : "No Homologado"}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                            {sku.codes.join(", ")}
                                        </span>
                                        <span className="ml-2 text-gray-500">
                                            ({sku.codes.length} código
                                            {sku.codes.length > 1 ? "s" : ""})
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    size="xs"
                                    color={sku.homologated ? "green" : "blue"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectSku(sku);
                                    }}
                                    leftSection={<RiAddLine />}
                                >
                                    Seleccionar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {searchingSku && (
                    <div className="mt-3 text-center py-4">
                        <Loader size="sm" />
                    </div>
                )}
            </div>

            {/* ---- Tabla de resultados ---- */}
            <div className="flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : !appliedFilters.selectedSkus.length ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                            <p className="text-xl text-gray-500 mb-2">
                                No se han seleccionado SKUs
                            </p>
                            <p className="text-sm text-gray-400">
                                Selecciona uno o más SKUs en el buscador de arriba y aplica los
                                filtros
                            </p>
                        </div>
                    </div>
                ) : hasData ? (
                    <div
                        id="tableSection"
                        ref={tableSectionRef}
                        className="bg-white mb-4 rounded-lg"
                    >
                        {renderComparisonTable()}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron datos para los SKUs seleccionados en el rango de
                        fechas especificado.
                    </div>
                )}
            </div>

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
