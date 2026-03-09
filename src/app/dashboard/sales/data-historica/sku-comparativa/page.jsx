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
    RiBarChartBoxLine,
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
    const chartSectionRef = useRef(null);

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
    const [reportType, setReportType] = useState("hectolitros");
    const [filtering, setFiltering] = useState(false);

    const [appliedFilters, setAppliedFilters] = useState({
        selectedSkus: [],
        startDate: getMonthStart(),
        endDate: getMonthEnd(),
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
            setStartDate(getMonthStart());
            setEndDate(getMonthEnd());
            setReportType("hectolitros");
            setAppliedFilters({
                selectedSkus: [],
                startDate: getMonthStart(),
                endDate: getMonthEnd(),
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
                hideSelectors: [".md\\:hidden", "[class*='md:hidden']"],
            });
            setSuccessMessage("Imagen de tabla descargada exitosamente");
        } catch (err) {
            console.error(err);
            setError("Error al descargar la imagen de la tabla.");
        } finally {
            setDownloadingImage(false);
        }
    }, [appliedFilters]);

    const downloadChartImage = useCallback(async () => {
        if (!chartSectionRef.current) return;
        setDownloadingImage(true);
        try {
            await generateChartImage(chartSectionRef.current, {
                filename: `sku_comparativa_grafica_${appliedFilters.startDate}_${appliedFilters.endDate}.png`,
                sectionId: "chartSection",
                width: 1600,
                scale: 2,
                padding: "40px 60px",
            });
            setSuccessMessage("Imagen de gráfica descargada exitosamente");
        } catch (err) {
            console.error(err);
            setError("Error al descargar la imagen de la gráfica.");
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
                hideSelectors: [".md\\:hidden", "[class*='md:hidden']"],
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
       Datos para la gráfica
    ========================================================= */
    const getChartData = () => {
        const dates = getDates();
        const legacyByDate = getLegacyByDate(); // { prodName: { fecha: val } }
        return dates.map((date) => {
            const entry = { date };
            if (skuData) {
                Object.entries(skuData).forEach(([productName, data]) => {
                    entry[productName] = data[date] || 0;
                });
            }
            Object.entries(legacyByDate).forEach(([legacyProd, byDate]) => {
                entry[`In&Out · ${legacyProd}`] = byDate[date] || 0;
            });
            return entry;
        });
    };

    /* =========================================================
       Tooltip personalizado
    ========================================================= */
    const renderCustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-[200px]">
                <p className="font-bold mb-2 text-gray-800">{label}</p>
                {payload.map((entry) => (
                    <div key={entry.dataKey} className="flex justify-between gap-4 text-sm">
                        <span style={{ color: entry.fill }}>● {entry.name}</span>
                        <span className="font-bold">{Number(entry.value).toFixed(2)}</span>
                    </div>
                ))}
            </div>
        );
    };

    /* =========================================================
       Render tabla de comparativa por SKU
    ========================================================= */
    const renderComparisonTable = () => {
        if (!skuData) return null;

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

                            {/* Tarjetas de resumen */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                {/* SKU Total */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center min-w-[120px]">
                                    <div className="text-xs text-blue-600 font-semibold uppercase mb-1">SKU Total</div>
                                    <div className="text-xl font-bold text-blue-800">{skuTotal.toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">{label}</div>
                                </div>
                                {/* Una tarjeta por producto In&Out */}
                                {legacyProducts.map((legacyProd, lIdx) => (
                                    <div key={legacyProd} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center min-w-[120px]">
                                        <div className="text-xs text-gray-600 font-semibold uppercase mb-1 truncate max-w-[140px]" title={legacyProd}>
                                            {legacyProd}
                                        </div>
                                        <div
                                            className="text-xl font-bold"
                                            style={{ color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length] }}
                                        >
                                            {(legacyProductTotals[legacyProd] || 0).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500">{label} In&Out</div>
                                    </div>
                                ))}
                                {/* Total In&Out combinado (solo si hay más de 1 producto) */}
                                {legacyProducts.length > 1 && (
                                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center min-w-[120px]">
                                        <div className="text-xs text-gray-700 font-semibold uppercase mb-1">Total In&Out</div>
                                        <div className="text-xl font-bold text-gray-800">{legacyGrandTotal.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">{label}</div>
                                    </div>
                                )}
                                {/* Diferencia */}
                                <div className={`border rounded-lg p-3 text-center min-w-[120px] ${diff >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                    <div className={`text-xs font-semibold uppercase mb-1 ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        Diferencia
                                    </div>
                                    <div className={`text-xl font-bold ${diff >= 0 ? "text-green-800" : "text-red-800"}`}>
                                        {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">{label}</div>
                                </div>
                                {/* Variación % */}
                                <div className={`border rounded-lg p-3 text-center min-w-[120px] ${pct === null ? "bg-gray-50 border-gray-200" : pct >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                    <div className={`text-xs font-semibold uppercase mb-1 ${pct === null ? "text-gray-500" : pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        Variación %
                                    </div>
                                    <div className={`text-xl font-bold ${pct === null ? "text-gray-500" : pct >= 0 ? "text-green-800" : "text-red-800"}`}>
                                        {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
                                    </div>
                                    <div className="text-xs text-gray-500">vs Total In&Out</div>
                                </div>
                            </div>

                            {/* Tabla Desktop */}
                            <div className="hidden md:block overflow-auto rounded-md">
                                <table className="table w-full text-sm">
                                    <thead className="bg-primary text-white text-xs uppercase font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="text-left">Fecha</th>
                                            <th className="text-center">
                                                {data.product_name || productName} ({label})
                                            </th>
                                            {legacyProducts.map((legProd) => {
                                                const availableYears = getYearsForProduct(legProd);
                                                const selectedYear = legacyYearSelections[legProd] || "";
                                                return (
                                                    <th key={legProd} className="text-center">
                                                        <div>{legProd} ({label})</div>
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
                                                                className="mt-1 text-xs font-normal normal-case bg-white text-gray-800 border border-gray-300 rounded px-1 py-0.5 cursor-pointer"
                                                            >
                                                                {availableYears.map((yr) => (
                                                                    <option key={yr} value={yr}>{yr}</option>
                                                                ))}
                                                            </select>
                                                        ) : availableYears.length === 1 ? (
                                                            <span className="text-xs font-normal normal-case opacity-75 ml-1">({availableYears[0]})</span>
                                                        ) : null}
                                                    </th>
                                                );
                                            })}
                                            {legacyProducts.length > 1 && (
                                                <th className="text-center">Total In&Out ({label})</th>
                                            )}
                                            <th className="text-center">Diferencia</th>
                                            <th className="text-center">Var. %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-black">
                                        {dates.map((date) => {
                                            const skuVal = data[date] || 0;
                                            const totalLegVal = legacyCombinedByDate[date] || 0;
                                            const d = skuVal - totalLegVal;
                                            const p =
                                                totalLegVal !== 0
                                                    ? ((skuVal - totalLegVal) / totalLegVal) * 100
                                                    : null;
                                            return (
                                                <tr key={date} className="hover:bg-gray-50">
                                                    <td className="font-mono text-xs">{date}</td>
                                                    <td className="text-center font-semibold" style={{ color: skuColor }}>
                                                        {skuVal > 0 ? skuVal.toFixed(2) : <span className="text-gray-400">0.00</span>}
                                                    </td>
                                                    {legacyProducts.map((legProd, lIdx) => {
                                                        const lv = legacyByDate[legProd]?.[date] || 0;
                                                        return (
                                                            <td
                                                                key={legProd}
                                                                className="text-center"
                                                                style={{ color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length] }}
                                                            >
                                                                {lv > 0 ? lv.toFixed(2) : <span className="text-gray-300">—</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    {legacyProducts.length > 1 && (
                                                        <td className="text-center font-semibold text-gray-700">
                                                            {totalLegVal > 0 ? totalLegVal.toFixed(2) : <span className="text-gray-300">—</span>}
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
                                            {legacyProducts.length > 1 && (
                                                <td className="text-center text-gray-700">
                                                    {legacyGrandTotal.toFixed(2)}
                                                </td>
                                            )}
                                            <td className={`text-center ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {(diff >= 0 ? "+" : "") + diff.toFixed(2)}
                                            </td>
                                            <td className={`text-center ${pct === null ? "text-gray-400" : pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Tabla Móvil */}
                            <div className="md:hidden space-y-2">
                                {dates.map((date) => {
                                    const skuVal = data[date] || 0;
                                    const totalLegVal = legacyCombinedByDate[date] || 0;
                                    const d = skuVal - totalLegVal;
                                    const p =
                                        totalLegVal !== 0
                                            ? ((skuVal - totalLegVal) / totalLegVal) * 100
                                            : null;
                                    return (
                                        <div key={date} className="bg-white border rounded-lg p-3">
                                            <div className="font-mono text-xs font-bold text-gray-600 mb-2">{date}</div>
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
                                                            {(legacyByDate[legProd]?.[date] || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {legacyProducts.length > 1 && (
                                                    <div>
                                                        <span className="text-xs text-gray-500">Total In&Out: </span>
                                                        <span className="font-bold text-gray-700">{totalLegVal.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-xs text-gray-500">Diff: </span>
                                                    <span className={`font-bold ${d >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                        {(d >= 0 ? "+" : "") + d.toFixed(2)}
                                                    </span>
                                                </div>
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
                                        {legacyProducts.length > 1 && (
                                            <div>
                                                Total In&Out:{" "}
                                                <span className="text-gray-700">{legacyGrandTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className={diff >= 0 ? "text-green-700" : "text-red-700"}>
                                            Diff: {(diff >= 0 ? "+" : "") + diff.toFixed(2)}
                                        </div>
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
    const chartData = hasData ? getChartData() : [];

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
                        onClick={downloadChartImage}
                        variant="outline"
                        color="indigo"
                        leftSection={<RiBarChartBoxLine />}
                        loading={downloadingImage}
                        disabled={!hasData || loading}
                        className="flex-1 md:flex-none"
                    >
                        Descargar Gráfica
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

            {/* ---- Gráfica comparativa ---- */}
            {hasData && chartData.length > 0 && (
                <div
                    id="chartSection"
                    ref={chartSectionRef}
                    className="bg-white mb-4 rounded-lg p-4 border border-gray-200"
                >
                    <h2 className="text-lg font-bold mb-1 uppercase text-center text-gray-800">
                        Comparativa por Fecha —{" "}
                        {appliedFilters.reportType === "hectolitros"
                            ? "Hectolitros"
                            : "Cajas"}
                    </h2>
                    <p className="text-xs text-center text-gray-500 mb-4">
                        SKU(s) seleccionados vs In&Out · datos por fecha
                    </p>
                    <ResponsiveContainer width="100%" height={420}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 24, right: 20, left: 20, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip content={renderCustomTooltip} />
                            <Legend />
                            {skuData &&
                                Object.keys(skuData).map((productName, idx) => (
                                    <Bar
                                        key={productName}
                                        dataKey={productName}
                                        fill={SKU_COLORS[idx % SKU_COLORS.length]}
                                    >
                                        <LabelList
                                            dataKey={productName}
                                            position="top"
                                            formatter={(v) => (v > 0 ? v.toFixed(1) : "")}
                                            style={{ fontSize: 9, fill: "#374151" }}
                                        />
                                    </Bar>
                                ))}
                            {legacyData?.results &&
                                typeof legacyData.results === "object" &&
                                Object.keys(legacyData.results).map((legacyProd, idx) => (
                                    <Bar
                                        key={`In&Out · ${legacyProd}`}
                                        dataKey={`In&Out · ${legacyProd}`}
                                        fill={LEGACY_COLORS[idx % LEGACY_COLORS.length]}
                                        name={`In&Out · ${legacyProd}`}
                                    >
                                        <LabelList
                                            dataKey={`In&Out · ${legacyProd}`}
                                            position="top"
                                            formatter={(v) => (v > 0 ? v.toFixed(1) : "")}
                                            style={{ fontSize: 9, fill: "#374151" }}
                                        />
                                    </Bar>
                                ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

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
