"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ENV } from "@/config/env";

const PERMISSION_PATH = "/dashboard/sales/data-historica/top-skus";

export default function TopSkusPage() {
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
    const [reportType, setReportType] = useState("caja");
    const [productCategory, setProductCategory] = useState("");
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        startYear: currentYear,
        endYear: currentYear,
        startWeek: 1,
        endWeek: 4,
        reportType: "caja",
        productCategory: "",
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
            const url = new URL(`${ENV.API_URL}/tada/top-skus-region/weekly-report/`);
            url.searchParams.append("start_year", appliedFilters.startYear);
            url.searchParams.append("end_year", appliedFilters.endYear);
            url.searchParams.append("start_week", appliedFilters.startWeek);
            url.searchParams.append("end_week", appliedFilters.endWeek);
            url.searchParams.append("report_type", appliedFilters.reportType);
            if (appliedFilters.productCategory) {
                url.searchParams.append("retornable", appliedFilters.productCategory);
            }

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
                productCategory,
            });
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setStartYear(currentYear);
            setEndYear(currentYear);
            setStartWeek(1);
            setEndWeek(4);
            setReportType("caja");
            setProductCategory("");
            setAppliedFilters({
                startYear: currentYear,
                endYear: currentYear,
                startWeek: 1,
                endWeek: 4,
                reportType: "caja",
                productCategory: "",
            });
        } finally {
            setFiltering(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const url = new URL(`${ENV.API_URL}/tada/top-skus-region/weekly-report/download/`);
            url.searchParams.append("start_year", appliedFilters.startYear);
            url.searchParams.append("end_year", appliedFilters.endYear);
            url.searchParams.append("start_week", appliedFilters.startWeek);
            url.searchParams.append("end_week", appliedFilters.endWeek);
            url.searchParams.append("report_type", appliedFilters.reportType);
            if (appliedFilters.productCategory) {
                url.searchParams.append("retornable", appliedFilters.productCategory);
            }

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
            a.download = `top_skus_${appliedFilters.reportType}_${appliedFilters.startYear}_${appliedFilters.endYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (err) {
            setError(err.message || "Error al descargar el archivo");
        } finally {
            setDownloading(false);
        }
    };

    /* =========================================================
       Detectar si tiene categorías con datos
    ========================================================= */
    const hasCategories = () => {
        if (!reportData) return false;
        
        const hasRetornable = reportData.retornable && 
            typeof reportData.retornable === 'object' && 
            Object.keys(reportData.retornable).length > 0;
        
        const hasNoRetornable = reportData.no_retornable && 
            typeof reportData.no_retornable === 'object' && 
            Object.keys(reportData.no_retornable).length > 0;
        
        return hasRetornable || hasNoRetornable;
    };

    /* =========================================================
       Obtener semanas del reporte
    ========================================================= */
    const getWeeks = () => {
        if (!reportData) return [];
        const weeks = new Set();
        
        if (hasCategories()) {
            // Estructura con categorías
            Object.values(reportData).forEach((categoryData) => {
                if (typeof categoryData === 'object' && categoryData !== null) {
                    Object.values(categoryData).forEach((regionData) => {
                        if (typeof regionData === 'object' && regionData !== null) {
                            Object.values(regionData).forEach((skuData) => {
                                Object.keys(skuData).forEach((key) => {
                                    if (key.startsWith("w")) {
                                        weeks.add(key);
                                    }
                                });
                            });
                        }
                    });
                }
            });
        } else {
            // Estructura sin categorías (directamente regiones)
            Object.values(reportData).forEach((regionData) => {
                if (typeof regionData === 'object' && regionData !== null) {
                    Object.values(regionData).forEach((skuData) => {
                        Object.keys(skuData).forEach((key) => {
                            if (key.startsWith("w")) {
                                weeks.add(key);
                            }
                        });
                    });
                }
            });
        }
        
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
        
        if (hasCategories()) {
            // Estructura con categorías
            Object.values(reportData).forEach((categoryData) => {
                if (typeof categoryData === 'object' && categoryData !== null) {
                    Object.values(categoryData).forEach((regionData) => {
                        if (typeof regionData === 'object' && regionData !== null) {
                            Object.values(regionData).forEach((skuData) => {
                                totals.total += skuData.total || 0;
                                weeks.forEach((week) => {
                                    totals[week] += skuData[week] || 0;
                                });
                            });
                        }
                    });
                }
            });
        } else {
            // Estructura sin categorías
            Object.values(reportData).forEach((regionData) => {
                if (typeof regionData === 'object' && regionData !== null) {
                    Object.values(regionData).forEach((skuData) => {
                        totals.total += skuData.total || 0;
                        weeks.forEach((week) => {
                            totals[week] += skuData[week] || 0;
                        });
                    });
                }
            });
        }

        return totals;
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
                            <th className="text-left">Región / SKU</th>
                            {weeks.map((week) => (
                                <th key={week}>{week.replace("w", "W")}</th>
                            ))}
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white text-black">
                        {Object.entries(data).map(([region, skus]) => (
                            <>
                                <tr key={region} className="bg-blue-50 font-bold">
                                    <td colSpan={weeks.length + 2} className="uppercase">
                                        {region}
                                    </td>
                                </tr>
                                {Object.entries(skus).map(([skuName, skuData]) => (
                                    <tr key={`${region}-${skuName}`}>
                                        <td className="pl-8">{skuName}</td>
                                        {weeks.map((week) => (
                                            <td key={week} className="text-center">
                                                {skuData[week] ? skuData[week].toFixed(0) : "-"}
                                            </td>
                                        ))}
                                        <td className="text-center font-bold">
                                            {skuData.total ? skuData.total.toFixed(0) : "0"}
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                    <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                        <tr>
                            <td className="text-center uppercase">Total General</td>
                            {weeks.map((week) => (
                                <td key={week} className="text-center text-blue-600">
                                    {grandTotals[week] ? grandTotals[week].toFixed(0) : "0"}
                                </td>
                            ))}
                            <td className="text-center text-green-600">
                                {grandTotals.total ? grandTotals.total.toFixed(0) : "0"}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Vista Móvil */}
            <div className="md:hidden block flex-1 overflow-auto space-y-4">
                {Object.entries(data).map(([region, skus]) => (
                    <Accordion key={region} variant="contained">
                        <Accordion.Item value={region}>
                            <Accordion.Control>
                                <div className="font-bold uppercase">{region}</div>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <div className="space-y-3">
                                    {Object.entries(skus).map(([skuName, skuData]) => (
                                        <div
                                            key={`${region}-${skuName}`}
                                            className="bg-white p-3 rounded-lg border"
                                        >
                                            <div className="font-bold text-sm mb-2">{skuName}</div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {weeks.map((week) => (
                                                    <div key={week} className="flex justify-between">
                                                        <span className="font-semibold">
                                                            {week.replace("w", "W")}:
                                                        </span>
                                                        <span>
                                                            {skuData[week]
                                                                ? skuData[week].toFixed(0)
                                                                : "-"}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between col-span-2 border-t pt-2 mt-2 font-bold">
                                                    <span>Total:</span>
                                                    <span>
                                                        {skuData.total
                                                            ? skuData.total.toFixed(0)
                                                            : "0"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                ))}

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
                                    {grandTotals[week] ? grandTotals[week].toFixed(0) : "0"}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between col-span-2 border-t-2 border-yellow-400 pt-2 mt-2 font-bold text-base">
                            <span>Total:</span>
                            <span className="text-green-600">
                                {grandTotals.total ? grandTotals.total.toFixed(0) : "0"}
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
    const showCategories = hasCategories();

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
                                    <Select
                                        label="Tipo de Producto"
                                        placeholder="Todos"
                                        value={productCategory}
                                        onChange={setProductCategory}
                                        data={[
                                            { value: "", label: "Todos" },
                                            { value: "retornable", label: "Retornable" },
                                            { value: "no_retornable", label: "No Retornable" },
                                        ]}
                                        clearable
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
                <div className="hidden md:grid md:grid-cols-8 grid-cols-1 gap-2 items-end">
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
                    <Select
                        label="Tipo de Producto"
                        placeholder="Todos"
                        value={productCategory}
                        onChange={setProductCategory}
                        data={[
                            { value: "", label: "Todos" },
                            { value: "retornable", label: "Retornable" },
                            { value: "no_retornable", label: "No Retornable" },
                        ]}
                        clearable
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

            {/* ---------------- TABLA ---------------- */}
            <div className="flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : reportData && Object.keys(reportData).length > 0 ? (
                    <>
                        {showCategories ? (
                            // Estructura con categorías - Múltiples tablas
                            <div className="flex-1 overflow-auto space-y-6">
                                {Object.entries(reportData)
                                    .filter(([_, categoryData]) => 
                                        typeof categoryData === 'object' && 
                                        categoryData !== null && 
                                        Object.keys(categoryData).length > 0
                                    )
                                    .map(([category, categoryData]) => (
                                        <div key={category}>
                                            <h2 className="text-xl font-bold mb-3 uppercase bg-purple-100 p-3 rounded-md sticky top-0 z-20">
                                                {category === "retornable" ? "Retornable" : "No Retornable"}
                                            </h2>
                                            {renderSimpleTable(categoryData, weeks, grandTotals)}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            // Estructura sin categorías - Tabla única
                            renderSimpleTable(reportData, weeks, grandTotals)
                        )}
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
