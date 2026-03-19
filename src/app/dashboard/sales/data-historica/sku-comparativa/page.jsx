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
                    return { skus: {} };
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
       Helpers de calendario
    ========================================================= */

    /** Construir mapa calendario desde datos SKU (claves MM-DD) usando el año del filtro.
     *  Retorna { "YYYY-MM": { "DD": value } }
     */
    const buildSkuCalendarMap = (skuProductData, skuYear) => {
        const calMap = {};
        Object.keys(skuProductData).forEach((k) => {
            if (isMdKey(k)) {
                const [mm, dd] = k.split("-");
                const colKey = `${skuYear}-${mm}`;
                if (!calMap[colKey]) calMap[colKey] = {};
                calMap[colKey][dd] = (calMap[colKey][dd] || 0) + (skuProductData[k] || 0);
            }
        });
        return calMap;
    };

    /** Construir mapa calendario desde records legacy (todos los años).
     *  Retorna { "YYYY-MM": { "DD": value } }
     */
    const buildLegacyCalendarMap = (records, field) => {
        const calMap = {};
        (records || []).forEach((r) => {
            // fecha formato "YYYY-MM-DD"
            const yyyy = r.fecha.slice(0, 4);
            const mm = r.fecha.slice(5, 7);
            const dd = r.fecha.slice(8, 10);
            const colKey = `${yyyy}-${mm}`;
            if (!calMap[colKey]) calMap[colKey] = {};
            calMap[colKey][dd] = (calMap[colKey][dd] || 0) + parseFloat(r[field] || 0);
        });
        return calMap;
    };

    /* =========================================================
       Render tabla calendario
       calendarMap: { "YYYY-MM": { "DD": value } }
    ========================================================= */
    const renderCalendarTable = (calendarMap) => {
        // Columnas ordenadas cronológicamente (YYYY-MM sort es lexicográfico correcto)
        const cols = Object.keys(calendarMap).sort();
        if (cols.length === 0) {
            return (
                <p className="text-xs text-gray-400 italic py-2">Sin datos disponibles.</p>
            );
        }

        const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

        // Totales por columna
        const colTotals = {};
        cols.forEach((col) => {
            colTotals[col] = Object.values(calendarMap[col] || {}).reduce((a, b) => a + b, 0);
        });
        const grandTotal = Object.values(colTotals).reduce((a, b) => a + b, 0);

        return (
            <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        {/* Fila 1: año por columna */}
                        <tr className="bg-black text-white">
                            <th className="text-center px-2 py-1 border border-gray-700 font-bold min-w-[40px]">
                                DAY
                            </th>
                            {cols.map((col) => (
                                <th
                                    key={`yr-${col}`}
                                    className="text-center px-2 py-1 border border-gray-700 font-bold min-w-[70px]"
                                >
                                    {col.slice(0, 4)}
                                </th>
                            ))}
                            <th className="text-center px-2 py-1 border border-gray-700 font-bold min-w-[80px]">
                                Total general
                            </th>
                        </tr>
                        {/* Fila 2: número de mes por columna */}
                        <tr className="bg-black text-white">
                            <th className="text-center px-2 py-1 border border-gray-700 font-bold">
                                DAY
                            </th>
                            {cols.map((col) => (
                                <th
                                    key={`mo-${col}`}
                                    className="text-center px-2 py-1 border border-gray-700 font-bold"
                                >
                                    {parseInt(col.slice(5), 10)}
                                </th>
                            ))}
                            <th className="text-center px-2 py-1 border border-gray-700 font-bold">
                                Total general
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white text-black">
                        {days.map((dd) => {
                            const rowValues = cols.map((col) => calendarMap[col]?.[dd] || 0);
                            const rowTotal = rowValues.reduce((a, b) => a + b, 0);
                            if (rowTotal === 0) return null;
                            return (
                                <tr key={dd} className="hover:bg-gray-50 border-b border-gray-100">
                                    <td className="text-center font-mono font-bold px-2 py-1 border border-gray-200 bg-gray-50">
                                        {dd}
                                    </td>
                                    {cols.map((col) => {
                                        const val = calendarMap[col]?.[dd] || 0;
                                        return (
                                            <td
                                                key={col}
                                                className="text-center px-2 py-1 border border-gray-200"
                                            >
                                                {val > 0 ? val.toFixed(2) : ""}
                                            </td>
                                        );
                                    })}
                                    <td className="text-center font-semibold px-2 py-1 border border-gray-200 bg-gray-50">
                                        {rowTotal.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-black text-white font-bold">
                            <td className="text-center px-2 py-1 border border-gray-700 uppercase text-xs">
                                Total
                            </td>
                            {cols.map((col) => (
                                <td
                                    key={col}
                                    className="text-center px-2 py-1 border border-gray-700"
                                >
                                    {colTotals[col] > 0 ? colTotals[col].toFixed(2) : "0.00"}
                                </td>
                            ))}
                            <td className="text-center px-2 py-1 border border-gray-700">
                                {grandTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    /* =========================================================
       Render tabla de comparativa por SKU
    ========================================================= */
    const renderComparisonTable = () => {
        if (!skuData) return null;

        const field = appliedFilters.reportType === "hectolitros" ? "hectolitros" : "cajas";
        const label = appliedFilters.reportType === "hectolitros" ? "HL" : "Cajas";
        const skuYear = appliedFilters.startDate.slice(0, 4);

        return (
            <>
                {Object.entries(skuData).map(([productName, data], idx) => {
                    const skuColor = SKU_COLORS[idx % SKU_COLORS.length];
                    const skuName = data.product_name || productName;
                    const skuCalMap = buildSkuCalendarMap(data, skuYear);

                    const legacyProducts = Object.keys(legacyData?.results || {});

                    // Pre-calcular mapas calendario por producto legacy (todos los años)
                    const legacyCalMaps = {};
                    legacyProducts.forEach((legProd) => {
                        legacyCalMaps[legProd] = buildLegacyCalendarMap(
                            legacyData?.results?.[legProd]?.records || [],
                            field
                        );
                    });

                    return (
                        <div key={productName} className="mb-8 last:mb-0">
                            {/* Encabezado del SKU */}
                            <div className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-md bg-purple-100 sticky top-0 z-20">
                                <h2 className="text-xl font-bold uppercase">{skuName}</h2>
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

                            {/* Tablas calendario por producto In&Out */}
                            {legacyProducts.map((legProd, lIdx) => (
                                <div key={legProd} className="mb-4">
                                    <h3
                                        className="text-sm font-bold uppercase mb-2"
                                        style={{
                                            color: LEGACY_COLORS[lIdx % LEGACY_COLORS.length],
                                        }}
                                    >
                                        In&Out: {legProd} ({label})
                                    </h3>
                                    {renderCalendarTable(legacyCalMaps[legProd])}
                                </div>
                            ))}

                            {/* Tabla calendario del SKU */}
                            <div className="mb-4">
                                <h3
                                    className="text-sm font-bold uppercase mb-2"
                                    style={{ color: skuColor }}
                                >
                                    {skuName} — SKU ({label}) {skuYear}
                                </h3>
                                {renderCalendarTable(skuCalMap)}
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
