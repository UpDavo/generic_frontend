"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Button,
    Loader,
    Notification,
    Select,
    Accordion,
    Switch,
    TextInput,
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
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import { ENV } from "@/config/env";
import { searchProductosApp } from "@/tada/services/ventasProductosAppApi";
import {
    getSkuMetricsReport,
    downloadSkuMetricsReport,
} from "@/tada/services/ventasHistoricasApi";
import {
    generateChartImage,
    generateChartImageBase64,
    generateTopSkusFilename,
} from "@/tada/services/salesImageGeneratorService";
import { sendReportToWhatsApp } from "@/tada/services/salesReportApi";

const PERMISSION_PATH = "/dashboard/sales/data-historica/sku-metrics";

// Los SKUs ahora se obtienen de la API de productos app mediante búsqueda
// Los reportes de métricas se obtienen de la API real: /api/sku-detail/city-poc/weekly-report/

export default function SkuMetricsPage() {
    const { accessToken, user } = useAuth();

    // Ref para capturar la sección de las tablas
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
    const handleSearchSku = async () => {
        if (!skuSearchTerm.trim()) {
            setSkuSearchResults([]);
            return;
        }

        setSearchingSku(true);
        try {
            // Llamada real a la API de productos app
            const results = await searchProductosApp(accessToken, skuSearchTerm);
            // Filtrar el que ya está seleccionado
            const filteredResults = selectedSku 
                ? results.filter(result => result.id !== selectedSku.id)
                : results;
            setSkuSearchResults(filteredResults);
        } catch (err) {
            console.error(err);
            setError("Error al buscar productos app");
        } finally {
            setSearchingSku(false);
        }
    };

    const handleSelectSku = (sku) => {
        setSelectedSku(sku); // Ahora guardamos el objeto completo
        setSkuSearchTerm("");
        setSkuSearchResults([]);
    };

    const handleClearSku = () => {
        setSelectedSku(null);
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
    
    const [selectedSku, setSelectedSku] = useState(null);
    const [skuSearchTerm, setSkuSearchTerm] = useState("");
    const [skuSearchResults, setSkuSearchResults] = useState([]);
    const [searchingSku, setSearchingSku] = useState(false);
    const [startDate, setStartDate] = useState(getMonthStart());
    const [endDate, setEndDate] = useState(getMonthEnd());
    const [reportType, setReportType] = useState("hectolitros");
    const [groupByCity, setGroupByCity] = useState(true); // Siempre marcado por defecto
    const [groupByPoc, setGroupByPoc] = useState(false);
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        selectedSku: null,
        startDate: getMonthStart(),
        endDate: getMonthEnd(),
        reportType: "hectolitros",
        groupByCity: true,
        groupByPoc: false,
    });

    /* ------------------- DATOS ------------------- */
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadingImage, setDownloadingImage] = useState(false);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    /* =========================================================
       Traer Reporte
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!appliedFilters.selectedSku) {
            setReportData(null);
            return;
        }

        setLoading(true);
        try {
            // Llamada real a la API
            const response = await getSkuMetricsReport(
                accessToken,
                appliedFilters.selectedSku.code,
                appliedFilters.startDate,
                appliedFilters.endDate,
                appliedFilters.reportType
            );
            
            // La respuesta viene con la estructura cities, debemos usarla directamente
            // o transformarla según los filtros de agrupación
            let processedData = {};
            
            if (appliedFilters.groupByCity && response.cities) {
                if (appliedFilters.groupByPoc) {
                    // Mostrar ciudades con POCs
                    processedData = response.cities;
                } else {
                    // Mostrar solo ciudades sin POCs
                    Object.entries(response.cities).forEach(([cityName, cityData]) => {
                        processedData[cityName] = {
                            total: cityData.total,
                            ...Object.keys(cityData)
                                .filter(key => key.startsWith('w'))
                                .reduce((acc, key) => ({ ...acc, [key]: cityData[key] }), {})
                        };
                    });
                }
            } else {
                // Sin agrupación por ciudad, mostrar solo totales generales
                processedData = {
                    'Total General': {
                        total: response.total,
                        ...Object.keys(response)
                            .filter(key => key.startsWith('w'))
                            .reduce((acc, key) => ({ ...acc, [key]: response[key] }), {})
                    }
                };
            }
            
            setReportData(processedData);
            setError(null);
        } catch (err) {
            setError(err.message || "Error al cargar el reporte");
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, accessToken]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    /* =========================================================
       Handlers
    ========================================================= */
    const applyFilters = async () => {
        if (!selectedSku) {
            setError("Por favor selecciona un SKU para continuar");
            return;
        }

        setFiltering(true);
        try {
            setAppliedFilters({
                selectedSku: selectedSku, // Guardamos el objeto completo
                startDate,
                endDate,
                reportType,
                groupByCity,
                groupByPoc,
            });
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setSelectedSku(null);
            setSkuSearchTerm("");
            setSkuSearchResults([]);
            setStartDate(getMonthStart());
            setEndDate(getMonthEnd());
            setReportType("hectolitros");
            setGroupByCity(true);
            setGroupByPoc(false);
            setAppliedFilters({
                selectedSku: null,
                startDate: getMonthStart(),
                endDate: getMonthEnd(),
                reportType: "hectolitros",
                groupByCity: true,
                groupByPoc: false,
            });
            setReportData(null);
        } finally {
            setFiltering(false);
        }
    };

    const handleDownload = async () => {
        if (!reportData) return;
        
        setDownloading(true);
        try {
            await downloadSkuMetricsReport(
                accessToken,
                appliedFilters.selectedSku.code,
                appliedFilters.startDate,
                appliedFilters.endDate,
                appliedFilters.reportType
            );
            setSuccessMessage('Reporte descargado exitosamente');
        } catch (err) {
            setError(err.message || 'Error al descargar el reporte');
        } finally {
            setDownloading(false);
        }
    };

    /* =========================================================
       Descargar imagen de las tablas
    ========================================================= */
    const downloadTableImage = useCallback(async () => {
        if (!tableSectionRef.current) return;

        setDownloadingImage(true);
        setError(null);

        try {
            const filename = `sku_metrics_${appliedFilters.selectedSku}_${appliedFilters.startDate}_${appliedFilters.endDate}.png`;
            await generateChartImage(tableSectionRef.current, {
                filename,
                sectionId: "tableSection",
                width: 1600,
                scale: 2,
                padding: "40px 60px",
                hideSelectors: [".md\\:hidden", "[class*='md:hidden']"],
            });
            setSuccessMessage("Imagen de las tablas descargada exitosamente");
        } catch (err) {
            console.error("Error downloading table image:", err);
            setError("Error al descargar la imagen. Intenta nuevamente.");
        } finally {
            setDownloadingImage(false);
        }
    }, [appliedFilters]);

    /* =========================================================
       Enviar imagen por WhatsApp
    ========================================================= */
    const sendTableToWhatsApp = useCallback(async () => {
        if (!tableSectionRef.current) return;

        setSendingWhatsApp(true);
        setError(null);

        try {
            const imageBase64 = await generateChartImageBase64(tableSectionRef.current, {
                sectionId: "tableSection",
                width: 1600,
                scale: 2,
                padding: "40px 60px",
                hideSelectors: [".md\\:hidden", "[class*='md:hidden']"],
            });

            const skuLabel = FAKE_SKUS.find(s => s.value === appliedFilters.selectedSku)?.label || appliedFilters.selectedSku;
            const title = `Métricas SKU: ${skuLabel} - ${appliedFilters.startDate} / ${appliedFilters.endDate}`;

            const response = await sendReportToWhatsApp(accessToken, imageBase64, title);

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
       Verificar si un objeto es un dato de métrica (tiene total y semanas)
    ========================================================= */
    const isMetricData = (obj) => {
        return obj && typeof obj === 'object' && 'total' in obj && 
               Object.keys(obj).some(k => k.startsWith('w')) &&
               !('pocs' in obj); // Si tiene 'pocs', es un nivel jerárquico, no un dato de métrica
    };

    /* =========================================================
       Obtener semanas del reporte
    ========================================================= */
    const getWeeks = () => {
        if (!reportData) return [];
        const weeks = new Set();
        
        const extractWeeks = (obj) => {
            if (isMetricData(obj)) {
                Object.keys(obj).forEach(key => {
                    if (key.startsWith('w')) weeks.add(key);
                });
            } else if (typeof obj === 'object') {
                Object.values(obj).forEach(value => extractWeeks(value));
            }
        };
        
        extractWeeks(reportData);
        
        return Array.from(weeks).sort((a, b) => {
            const numA = parseInt(a.replace("w", ""));
            const numB = parseInt(b.replace("w", ""));
            return numA - numB;
        });
    };

    /* =========================================================
       Calcular totales generales
    ========================================================= */
    const getGrandTotals = () => {
        if (!reportData) return {};
        const weeks = getWeeks();
        const totals = { total: 0 };
        
        weeks.forEach((week) => {
            totals[week] = 0;
        });
        
        const sumTotals = (obj) => {
            if (isMetricData(obj)) {
                weeks.forEach(week => {
                    totals[week] += obj[week] || 0;
                });
                totals.total += obj.total || 0;
            } else if (typeof obj === 'object') {
                Object.values(obj).forEach(value => sumTotals(value));
            }
        };
        
        sumTotals(reportData);
        return totals;
    };

    /* =========================================================
       Renderizar jerarquía móvil recursivamente
    ========================================================= */
    const renderMobileHierarchy = (data, weeks, level = 0) => {
        return Object.entries(data).map(([key, value]) => {
            // Si tiene 'pocs', es una ciudad con POCs
            if (value && typeof value === 'object' && 'pocs' in value) {
                return (
                    <Accordion key={key} variant="contained">
                        <Accordion.Item value={key}>
                            <Accordion.Control>
                                <div className="font-bold uppercase">{key}</div>
                            </Accordion.Control>
                            <Accordion.Panel>
                                {/* Mostrar totales de la ciudad */}
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-3">
                                    <div className="font-bold mb-2 text-purple-900">Totales de {key}</div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {weeks.map(week => (
                                            <div key={week} className="flex justify-between">
                                                <span>{week.replace("w", "W")}:</span>
                                                <span className="font-semibold">{value[week]?.toFixed(2) || "0.00"}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between col-span-2 border-t border-purple-300 pt-2 mt-2 font-bold">
                                            <span>Total:</span>
                                            <span className="text-green-600">{value.total?.toFixed(2) || "0.00"}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Mostrar POCs */}
                                <div className="space-y-3">
                                    {renderMobileHierarchy(value.pocs, weeks, level + 1)}
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                );
            }
            
            // Si es un dato de métrica puro (sin pocs)
            if (isMetricData(value)) {
                return (
                    <div key={key} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="font-bold mb-2 uppercase">{key}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {weeks.map(week => (
                                <div key={week} className="flex justify-between">
                                    <span>{week.replace("w", "W")}:</span>
                                    <span className="font-semibold">{value[week]?.toFixed(2) || "0.00"}</span>
                                </div>
                            ))}
                            <div className="flex justify-between col-span-2 border-t border-blue-300 pt-2 mt-2 font-bold">
                                <span>Total:</span>
                                <span className="text-green-600">{value.total?.toFixed(2) || "0.00"}</span>
                            </div>
                        </div>
                    </div>
                );
            }
            
            // Si es otro nivel jerárquico
            return (
                <Accordion key={key} variant="contained">
                    <Accordion.Item value={key}>
                        <Accordion.Control>
                            <div className="font-bold uppercase">{key}</div>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <div className="space-y-3">
                                {renderMobileHierarchy(value, weeks, level + 1)}
                            </div>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            );
        });
    };

    /* =========================================================
       Renderizar jerarquía recursivamente
    ========================================================= */
    const renderHierarchy = (data, weeks, level = 0, parentKey = '') => {
        const entries = Object.entries(data);
        
        return entries.map(([key, value]) => {
            const uniqueKey = parentKey ? `${parentKey}-${key}` : key;
            
            // Si tiene 'pocs', es una ciudad con POCs
            if (value && typeof value === 'object' && 'pocs' in value) {
                return (
                    <React.Fragment key={uniqueKey}>
                        {/* Fila de la ciudad */}
                        <tr className="bg-purple-100 font-bold text-purple-900">
                            <td className="pl-4 uppercase" style={{ paddingLeft: `${level * 20 + 16}px` }}>
                                {key}
                            </td>
                            {weeks.map(week => (
                                <td key={week} className="text-center">
                                    {value[week]?.toFixed(2) || "0.00"}
                                </td>
                            ))}
                            <td className="text-center text-green-600">
                                {value.total?.toFixed(2) || "0.00"}
                            </td>
                        </tr>
                        {/* Renderizar POCs de esta ciudad */}
                        {renderHierarchy(value.pocs, weeks, level + 1, uniqueKey)}
                    </React.Fragment>
                );
            }
            
            // Si es un dato de métrica (hoja)
            if (isMetricData(value)) {
                return (
                    <tr key={uniqueKey} className="hover:bg-gray-100">
                        <td className="pl-4" style={{ paddingLeft: `${level * 20 + 16}px` }}>
                            {key}
                        </td>
                        {weeks.map(week => (
                            <td key={week} className="text-center">
                                {value[week]?.toFixed(2) || "0.00"}
                            </td>
                        ))}
                        <td className="text-center font-bold text-green-600">
                            {value.total?.toFixed(2) || "0.00"}
                        </td>
                    </tr>
                );
            }
            
            // Si es otro nivel jerárquico
            return (
                <React.Fragment key={uniqueKey}>
                    <tr className="bg-gray-100 font-bold">
                        <td className="uppercase" style={{ paddingLeft: `${level * 20 + 16}px` }}>
                            {key}
                        </td>
                        {weeks.map(week => (
                            <td key={week}></td>
                        ))}
                        <td></td>
                    </tr>
                    {renderHierarchy(value, weeks, level + 1, uniqueKey)}
                </React.Fragment>
            );
        });
    };

    /* =========================================================
       Render tabla simple
    ========================================================= */
    const renderSimpleTable = (data, weeks, grandTotals) => (
        <>
            {/* Vista Desktop */}
            <div className="hidden md:block flex-1 overflow-auto rounded-md">
                <table className="table w-full">
                    <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                        <tr>
                            <th className="text-left">Jerarquía / Ubicación</th>
                            {weeks.map((week) => (
                                <th key={week}>{week.replace("w", "W")}</th>
                            ))}
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white text-black">
                        {renderHierarchy(data, weeks)}
                    </tbody>
                    <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                        <tr>
                            <td className="text-center uppercase">Total General</td>
                            {weeks.map((week) => (
                                <td key={week} className="text-center text-blue-600">
                                    {grandTotals[week] ? grandTotals[week].toFixed(2) : "0.00"}
                                </td>
                            ))}
                            <td className="text-center text-green-600">
                                {grandTotals.total ? grandTotals.total.toFixed(2) : "0.00"}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Vista Móvil */}
            <div className="md:hidden block flex-1 overflow-auto space-y-4">
                {renderMobileHierarchy(data, weeks)}

                {/* Total General Mobile */}
                <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
                    <div className="font-bold text-lg mb-3 uppercase text-center">
                        Total General
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {weeks.map((week) => (
                            <div key={week} className="flex justify-between">
                                <span className="font-semibold">{week.replace("w", "W")}:</span>
                                <span className="text-blue-600 font-bold">
                                    {grandTotals[week] ? grandTotals[week].toFixed(2) : "0.00"}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between col-span-2 border-t-2 border-yellow-400 pt-2 mt-2 font-bold text-base">
                            <span>Total:</span>
                            <span className="text-green-600">
                                {grandTotals.total ? grandTotals.total.toFixed(2) : "0.00"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

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

    const weeks = getWeeks();
    const grandTotals = getGrandTotals();

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
                {/* Botones de acción siempre visibles */}
                <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                        onClick={handleDownload}
                        variant="filled"
                        color="teal"
                        leftSection={<RiDownloadCloudLine />}
                        loading={downloading}
                        disabled={!reportData}
                        className="flex-1 md:flex-none"
                    >
                        Descargar Excel
                    </Button>
                    <Button
                        onClick={downloadTableImage}
                        variant="outline"
                        color="violet"
                        leftSection={<RiImageLine />}
                        loading={downloadingImage}
                        disabled={!reportData || loading}
                        className="flex-1 md:flex-none"
                    >
                        Descargar Imagen
                    </Button>
                    <Button
                        onClick={sendTableToWhatsApp}
                        variant="filled"
                        color="green"
                        leftSection={<RiWhatsappLine />}
                        loading={sendingWhatsApp}
                        disabled={!reportData || loading}
                        className="flex-1 md:flex-none"
                    >
                        Enviar por WhatsApp
                    </Button>
                </div>

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
                                    <div className="space-y-2 mt-3">
                                        <Switch
                                            label="Agrupar por Ciudad"
                                            checked={groupByCity}
                                            onChange={(e) => {
                                                const checked = e.currentTarget.checked;
                                                setGroupByCity(checked);
                                                if (!checked) {
                                                    setGroupByPoc(false);
                                                }
                                            }}
                                        />
                                        <Switch
                                            label="Agrupar por POC"
                                            checked={groupByPoc}
                                            disabled={!groupByCity}
                                            onChange={(e) => setGroupByPoc(e.currentTarget.checked)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Button
                                            onClick={applyFilters}
                                            variant="filled"
                                            leftSection={<RiSearchLine />}
                                            disabled={loading || filtering || !selectedSku}
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
                                        disabled={loading || filtering || !appliedFilters.selectedSku}
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
                <div className="hidden md:block space-y-3">
                    <div className="flex gap-4 mb-3">
                        <Switch
                            label="Agrupar por Ciudad"
                            checked={groupByCity}
                            onChange={(e) => {
                                const checked = e.currentTarget.checked;
                                setGroupByCity(checked);
                                if (!checked) {
                                    setGroupByPoc(false);
                                }
                            }}
                        />
                        <Switch
                            label="Agrupar por POC"
                            checked={groupByPoc}
                            disabled={!groupByCity}
                            onChange={(e) => setGroupByPoc(e.currentTarget.checked)}
                        />
                    </div>
                    <div className="grid md:grid-cols-5 grid-cols-1 gap-2 items-end">
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
                            disabled={loading || filtering || !selectedSku}
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


            {/* ---------------- BUSCADOR DE SKU ---------------- */}
            <div className="mb-4 flex-shrink-0">
                <div className="bg-white">
                    
                    {/* SKU seleccionado */}
                    {selectedSku && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200 flex justify-between items-center">
                            <div>
                                <div className="font-semibold text-sm text-blue-900">
                                    {selectedSku.name}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    <span className="font-mono bg-white px-2 py-0.5 rounded">
                                        {selectedSku.code}
                                    </span>
                                    {selectedSku.type && (
                                        <span className="ml-2 text-blue-600">• Tipo: {selectedSku.type}</span>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="xs"
                                color="red"
                                variant="light"
                                onClick={handleClearSku}
                                leftSection={<RiDeleteBinLine />}
                            >
                                Limpiar
                            </Button>
                        </div>
                    )}

                    {/* Buscador */}
                    {!selectedSku && (
                        <div className="mb-3">
                            <label className="text-sm font-medium mb-2 block">
                                Buscar SKU
                            </label>
                            <div className="flex gap-2">
                                <TextInput
                                    placeholder="Buscar por nombre o código de SKU..."
                                    value={skuSearchTerm}
                                    onChange={(e) => setSkuSearchTerm(e.currentTarget.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSearchSku();
                                        }
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

                            {/* Resultados de búsqueda */}
                            {skuSearchResults.length > 0 && (
                                <div className="mt-3 border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                                    {skuSearchResults.map((sku) => (
                                        <div
                                            key={sku.id}
                                            className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center cursor-pointer"
                                            onClick={() => handleSelectSku(sku)}
                                        >
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">
                                                    {sku.name}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                        {sku.code}
                                                    </span>
                                                    {sku.type && (
                                                        <span className="ml-2">Tipo: {sku.type}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="xs"
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
                    )}
                </div>
            </div>


            {/* ---------------- TABLA ---------------- */}
            <div className="flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : !appliedFilters.selectedSku ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                            <p className="text-xl text-gray-500 mb-2">
                                No se ha seleccionado ningún SKU
                            </p>
                            <p className="text-sm text-gray-400">
                                Selecciona un SKU en el buscador de arriba y aplica los filtros
                            </p>
                        </div>
                    </div>
                ) : reportData && Object.keys(reportData).length > 0 ? (
                    <div id="tableSection" ref={tableSectionRef} className="bg-white rounded-lg">
                        {renderSimpleTable(reportData, weeks, grandTotals)}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        No se encontraron datos para el SKU seleccionado en el rango de fechas especificado.
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
