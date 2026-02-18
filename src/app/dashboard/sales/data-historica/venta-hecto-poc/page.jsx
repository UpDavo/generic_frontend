"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
    RiArrowUpSLine,
    RiArrowDownSLine,
    RiArrowUpDownLine,
    RiAddLine,
    RiDeleteBinLine,
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import {
    generateChartImage,
    generateChartImageBase64,
} from "@/tada/services/salesImageGeneratorService";
import { sendReportToWhatsApp } from "@/tada/services/salesReportApi";
import { getVentaHectoPoc, downloadVentaHectoPoc } from "@/tada/services/ventaHectoPocApi";

const PERMISSION_PATH = "/dashboard/sales/data-historica/venta-hecto-poc";

export default function VentaHectoPocPage() {
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

    /* ------------------- FILTROS ------------------- */
    const getWeekStart = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.getFullYear(), now.getMonth(), diff)
            .toISOString()
            .slice(0, 10);
    };

    const getWeekEnd = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? 0 : 7);
        return new Date(now.getFullYear(), now.getMonth(), diff)
            .toISOString()
            .slice(0, 10);
    };

    const [startDate, setStartDate] = useState(getWeekStart());
    const [endDate, setEndDate] = useState(getWeekEnd());
    const [reportType, setReportType] = useState("hectolitros");
    const [groupByCity, setGroupByCity] = useState(false);
    const [filtering, setFiltering] = useState(false);

    /* ------------------- FILTROS APLICADOS ------------------- */
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: getWeekStart(),
        endDate: getWeekEnd(),
        reportType: "hectolitros",
        groupByCity: false,
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

    /* ------------------- BÚSQUEDA LOCAL Y ORDENAMIENTO ------------------- */
    const [searchPoc, setSearchPoc] = useState("");
    // sortColumn: null | "total" | fecha (e.g. "2026-02-09") | "range-0", "range-1"...
    const [sortColumn, setSortColumn] = useState(null);
    // sortDirection: "asc" | "desc"
    const [sortDirection, setSortDirection] = useState("desc");

    /* ------------------- COLUMNAS DE RANGO DE DÍAS ------------------- */
    // Cada rango: { id, fromDate, toDate, label }
    const [dayRanges, setDayRanges] = useState([]);
    const [rangeFromDate, setRangeFromDate] = useState("");
    const [rangeToDate, setRangeToDate] = useState("");

    /* =========================================================
       Traer Reporte
    ========================================================= */
    const fetchReport = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await getVentaHectoPoc(
                accessToken,
                appliedFilters.startDate,
                appliedFilters.endDate,
                appliedFilters.reportType,
                appliedFilters.groupByCity
            );
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
                startDate,
                endDate,
                reportType,
                groupByCity,
            });
        } finally {
            setFiltering(false);
        }
    };

    const clearFilters = async () => {
        setFiltering(true);
        try {
            setStartDate(getWeekStart());
            setEndDate(getWeekEnd());
            setReportType("hectolitros");
            setGroupByCity(false);
            setAppliedFilters({
                startDate: getWeekStart(),
                endDate: getWeekEnd(),
                reportType: "hectolitros",
                groupByCity: false,
            });
        } finally {
            setFiltering(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadVentaHectoPoc(
                accessToken,
                appliedFilters.startDate,
                appliedFilters.endDate,
                appliedFilters.reportType,
                appliedFilters.groupByCity
            );
        } catch (err) {
            setError(err.message || "Error al descargar el archivo");
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
            const filename = `venta_hecto_poc_${appliedFilters.reportType}_${appliedFilters.startDate}_${appliedFilters.endDate}`;
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

            const title = `Venta Hectolitros por POC ${appliedFilters.reportType} ${appliedFilters.startDate} - ${appliedFilters.endDate}`;
            await sendReportToWhatsApp(accessToken, imageBase64, title);

            setShowSuccessOverlay(true);
        } catch (err) {
            console.error("Error sending to WhatsApp:", err);
            setError(err.message || "Error al enviar el reporte por WhatsApp");
            setSendingWhatsApp(false);
        }
    }, [accessToken, appliedFilters]);

    const handleSuccessOverlayClose = () => {
        setShowSuccessOverlay(false);
        setSendingWhatsApp(false);
    };

    /* =========================================================
       Extraer datos del reporte
    ========================================================= */

    /**
     * Detecta si los datos están agrupados por ciudad.
     * Agrupado: { "CUENCA": { "TADA X": { "2026-02-09": {...} } } }
     * No agrupado: { "TADA X": { "2026-02-09": {...} } }
     */
    const isGroupedByCity = () => {
        if (!reportData) return false;
        const firstValue = Object.values(reportData)[0];
        if (!firstValue || typeof firstValue !== "object") return false;
        // Si el primer sub-valor también es un objeto con objetos adentro (no tiene nombre_dia), es agrupado
        const firstSubValue = Object.values(firstValue)[0];
        if (!firstSubValue || typeof firstSubValue !== "object") return false;
        return !("nombre_dia" in firstSubValue);
    };

    /**
     * Obtiene las columnas de días (fechas) con sus nombres de día.
     * Retorna un array de { date, dayName } ordenado por fecha.
     */
    const getDayColumns = () => {
        if (!reportData) return [];
        const daysMap = new Map();

        const extractDays = (pocData) => {
            Object.entries(pocData).forEach(([dateStr, info]) => {
                if (typeof info === "object" && info !== null && "nombre_dia" in info) {
                    daysMap.set(dateStr, info.nombre_dia);
                }
            });
        };

        if (isGroupedByCity()) {
            Object.values(reportData).forEach((cityData) => {
                Object.values(cityData).forEach((pocData) => {
                    extractDays(pocData);
                });
            });
        } else {
            Object.values(reportData).forEach((pocData) => {
                extractDays(pocData);
            });
        }

        return Array.from(daysMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayName]) => ({ date, dayName }));
    };

    /**
     * Mini gráfica de barras inline para cada fila.
     * Recibe pocData, days y rType, y dibuja barras proporcionales al máximo.
     * Usa estilos inline para que html2canvas las capture correctamente.
     */
    const MiniBarChart = ({ pocData, days, rType }) => {
        const values = days.map((d) => pocData[d.date]?.[rType] ?? 0);
        const max = Math.max(...values, 0.01);
        return (
            <div
                data-barchart="container"
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 2,
                    height: 28,
                    minWidth: days.length * 8,
                }}
            >
                {values.map((v, i) => (
                    <div
                        key={i}
                        data-barchart="bar"
                        title={`${days[i].dayName}: ${v.toFixed(2)}`}
                        style={{
                            width: 6,
                            height: `${Math.max((v / max) * 100, 2)}%`,
                            minHeight: v > 0 ? 2 : 0,
                            backgroundColor: "#3b82f6",
                            borderRadius: 2,
                        }}
                    />
                ))}
            </div>
        );
    };

    /**
     * Calcula el total de un POC en todas las fechas.
     */
    const getPocTotal = (pocData, reportType) => {
        let total = 0;
        Object.values(pocData).forEach((info) => {
            if (typeof info === "object" && info !== null && reportType in info) {
                total += info[reportType] || 0;
            }
        });
        return total;
    };

    /**
     * Calcula los totales generales por columna (por día y total).
     */
    const getGrandTotals = (data, days, reportType) => {
        const totals = { total: 0 };
        days.forEach((d) => {
            totals[d.date] = 0;
        });

        const sumPoc = (pocData) => {
            days.forEach((d) => {
                const val = pocData[d.date]?.[reportType] || 0;
                totals[d.date] += val;
                totals.total += val;
            });
        };

        if (isGroupedByCity()) {
            Object.values(data).forEach((cityData) => {
                Object.values(cityData).forEach((pocData) => {
                    sumPoc(pocData);
                });
            });
        } else {
            Object.values(data).forEach((pocData) => {
                sumPoc(pocData);
            });
        }

        return totals;
    };

    /**
     * Calcula los totales de una ciudad.
     */
    const getCityTotals = (cityData, days, reportType) => {
        const totals = { total: 0 };
        days.forEach((d) => {
            totals[d.date] = 0;
        });
        Object.values(cityData).forEach((pocData) => {
            days.forEach((d) => {
                const val = pocData[d.date]?.[reportType] || 0;
                totals[d.date] += val;
                totals.total += val;
            });
        });
        return totals;
    };

    /* =========================================================
       Filtrar y ordenar datos
    ========================================================= */
    const filterAndSortEntries = (entries, days, rType) => {
        // Filtrar por nombre de POC
        let filtered = entries;
        if (searchPoc.trim()) {
            const term = searchPoc.trim().toLowerCase();
            filtered = entries.filter(([pocName]) =>
                pocName.toLowerCase().includes(term)
            );
        }

        // Ordenar
        if (sortColumn) {
            filtered = [...filtered].sort(([nameA, dataA], [nameB, dataB]) => {
                let valA, valB;
                if (sortColumn === "total") {
                    valA = getPocTotal(dataA, rType);
                    valB = getPocTotal(dataB, rType);
                } else if (sortColumn === "poc") {
                    valA = nameA.toLowerCase();
                    valB = nameB.toLowerCase();
                    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
                    return sortDirection === "asc" ? cmp : -cmp;
                } else {
                    // Verificar si es un rango
                    const range = dayRanges.find((r) => r.id === sortColumn);
                    if (range) {
                        valA = getPocRangeTotal(dataA, range.fromDate, range.toDate, rType);
                        valB = getPocRangeTotal(dataB, range.fromDate, range.toDate, rType);
                    } else {
                        // sortColumn es una fecha
                        valA = dataA[sortColumn]?.[rType] || 0;
                        valB = dataB[sortColumn]?.[rType] || 0;
                    }
                }
                return sortDirection === "asc" ? valA - valB : valB - valA;
            });
        }

        return filtered;
    };

    const filterAndSortGroupedData = (data, days, rType) => {
        const result = {};
        Object.entries(data).forEach(([cityName, cityData]) => {
            const sortedEntries = filterAndSortEntries(Object.entries(cityData), days, rType);
            if (sortedEntries.length > 0) {
                result[cityName] = Object.fromEntries(sortedEntries);
            }
        });
        return result;
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            // Toggle direction or clear
            if (sortDirection === "desc") {
                setSortDirection("asc");
            } else {
                setSortColumn(null);
                setSortDirection("desc");
            }
        } else {
            setSortColumn(column);
            setSortDirection("desc");
        }
    };

    const SortIcon = ({ column }) => {
        if (sortColumn !== column) {
            return <RiArrowUpDownLine className="inline ml-1 opacity-40" size={14} />;
        }
        return sortDirection === "desc"
            ? <RiArrowDownSLine className="inline ml-1" size={16} />
            : <RiArrowUpSLine className="inline ml-1" size={16} />;
    };

    /* =========================================================
       Columnas de rango de días
    ========================================================= */
    const DAY_ABBREV = {
        Lunes: "Lu",
        Martes: "Ma",
        Miércoles: "Mi",
        Jueves: "Ju",
        Viernes: "Vi",
        Sábado: "Sa",
        Domingo: "Do",
    };

    const addDayRange = (days) => {
        if (!rangeFromDate || !rangeToDate) return;
        // Validar que ambas fechas existan en days
        const fromDay = days.find((d) => d.date === rangeFromDate);
        const toDay = days.find((d) => d.date === rangeToDate);
        if (!fromDay || !toDay) return;
        // Validar orden
        if (rangeFromDate > rangeToDate) return;

        const fromAbbr = DAY_ABBREV[fromDay.dayName] || fromDay.dayName.slice(0, 2);
        const toAbbr = DAY_ABBREV[toDay.dayName] || toDay.dayName.slice(0, 2);
        const label = rangeFromDate === rangeToDate ? `Prom ${fromAbbr}` : `Prom ${fromAbbr}${toAbbr}`;

        setDayRanges((prev) => [
            ...prev,
            {
                id: `range-${Date.now()}`,
                fromDate: rangeFromDate,
                toDate: rangeToDate,
                label,
            },
        ]);
        setRangeFromDate("");
        setRangeToDate("");
    };

    const removeDayRange = (id) => {
        setDayRanges((prev) => prev.filter((r) => r.id !== id));
        if (sortColumn === id) {
            setSortColumn(null);
            setSortDirection("desc");
        }
    };

    /**
     * Calcula el número de días en un rango de fechas.
     */
    const countDaysInRange = (fromDate, toDate) => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diffTime = Math.abs(to - from);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    /**
     * Calcula el promedio de valores de un POC en un rango de fechas.
     * (Suma de valores / cantidad de días en el rango)
     */
    const getPocRangeTotal = (pocData, fromDate, toDate, rType) => {
        let total = 0;
        Object.entries(pocData).forEach(([dateStr, info]) => {
            if (
                typeof info === "object" &&
                info !== null &&
                rType in info &&
                dateStr >= fromDate &&
                dateStr <= toDate
            ) {
                total += info[rType] || 0;
            }
        });
        const numDays = countDaysInRange(fromDate, toDate);
        return numDays > 0 ? total / numDays : 0;
    };

    /**
     * Calcula el total general de un rango para todos los POCs (flat).
     */
    const getGrandRangeTotal = (data, fromDate, toDate, rType, isGrouped) => {
        let total = 0;
        if (isGrouped) {
            Object.values(data).forEach((cityData) => {
                Object.values(cityData).forEach((pocData) => {
                    total += getPocRangeTotal(pocData, fromDate, toDate, rType);
                });
            });
        } else {
            Object.values(data).forEach((pocData) => {
                total += getPocRangeTotal(pocData, fromDate, toDate, rType);
            });
        }
        return total;
    };

    /**
     * Calcula el total de un rango para una ciudad.
     */
    const getCityRangeTotal = (cityData, fromDate, toDate, rType) => {
        let total = 0;
        Object.values(cityData).forEach((pocData) => {
            total += getPocRangeTotal(pocData, fromDate, toDate, rType);
        });
        return total;
    };

    /* =========================================================
       Render tabla sin agrupación (solo POCs)
    ========================================================= */
    const renderFlatTable = (data, days, grandTotals, rType) => {
        const sortedEntries = filterAndSortEntries(Object.entries(data), days, rType);
        return (
            <>
                {/* Vista Desktop */}
                <div className="hidden md:block flex-1 overflow-auto rounded-md">
                    <table className="table w-full">
                        <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="text-left cursor-pointer select-none" onClick={() => handleSort("poc")}>
                                    POC <SortIcon column="poc" />
                                </th>
                                {days.map((d) => (
                                    <th key={d.date} className="cursor-pointer select-none" onClick={() => handleSort(d.date)}>
                                        <span className="block leading-tight">{d.dayName}</span>
                                        <span className="block font-normal normal-case text-xs opacity-75">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
                                        <SortIcon column={d.date} />
                                    </th>
                                ))}
                                <th className="cursor-pointer select-none" onClick={() => handleSort("total")}>
                                    Total <SortIcon column="total" />
                                </th>
                                <th className="text-center">Gráfica</th>
                                {dayRanges.map((range) => (
                                    <th key={range.id} className="cursor-pointer select-none bg-amber-600" onClick={() => handleSort(range.id)}>
                                        {range.label} <SortIcon column={range.id} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white text-black">
                            {sortedEntries.map(([pocName, pocData]) => {
                                const total = getPocTotal(pocData, rType);
                                return (
                                    <tr key={pocName}>
                                        <td className="font-medium">{pocName}</td>
                                        {days.map((d) => (
                                            <td key={d.date} className="text-center">
                                                {pocData[d.date]?.[rType] != null
                                                    ? pocData[d.date][rType].toFixed(2)
                                                    : "-"}
                                            </td>
                                        ))}
                                        <td className="text-center font-bold">
                                            {total.toFixed(2)}
                                        </td>
                                        <td className="text-center">
                                            <MiniBarChart pocData={pocData} days={days} rType={rType} />
                                        </td>
                                        {dayRanges.map((range) => (
                                            <td key={range.id} className="text-center font-semibold text-amber-700 bg-amber-50">
                                                {getPocRangeTotal(pocData, range.fromDate, range.toDate, rType).toFixed(2)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                            <tr>
                                <td className="text-center uppercase">Total General</td>
                                {days.map((d) => (
                                    <td key={d.date} className="text-center text-blue-600">
                                        {grandTotals[d.date]
                                            ? grandTotals[d.date].toFixed(2)
                                            : "0.00"}
                                    </td>
                                ))}
                                <td className="text-center text-green-600">
                                    {grandTotals.total ? grandTotals.total.toFixed(2) : "0.00"}
                                </td>
                                <td></td>
                                {dayRanges.map((range) => (
                                    <td key={range.id} className="text-center text-amber-700 bg-amber-100">
                                        {getGrandRangeTotal(data, range.fromDate, range.toDate, rType, false).toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Vista Móvil */}
                <div className="md:hidden block flex-1 overflow-auto space-y-4">
                    {sortedEntries.map(([pocName, pocData]) => {
                        const total = getPocTotal(pocData, rType);
                        return (
                            <div key={pocName} className="bg-white p-3 rounded-lg border">
                                <div className="font-bold text-sm mb-2">{pocName}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {days.map((d) => (
                                        <div key={d.date} className="flex justify-between">
                                            <span className="font-semibold">{d.dayName}:</span>
                                            <span>
                                                {pocData[d.date]?.[rType] != null
                                                    ? pocData[d.date][rType].toFixed(2)
                                                    : "-"}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between col-span-2 border-t pt-2 mt-2 font-bold">
                                        <span>Total:</span>
                                        <span>{total.toFixed(2)}</span>
                                    </div>
                                    {dayRanges.map((range) => (
                                        <div key={range.id} className="flex justify-between col-span-2 text-amber-700">
                                            <span className="font-semibold">{range.label}:</span>
                                            <span className="font-bold">
                                                {getPocRangeTotal(pocData, range.fromDate, range.toDate, rType).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {/* Total General Mobile */}
                    <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
                        <div className="font-bold text-lg mb-3 uppercase text-center">
                            Total General
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {days.map((d) => (
                                <div key={d.date} className="flex justify-between">
                                    <span className="font-semibold">{d.dayName}:</span>
                                    <span className="text-blue-600 font-bold">
                                        {grandTotals[d.date]
                                            ? grandTotals[d.date].toFixed(2)
                                            : "0.00"}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between col-span-2 border-t-2 border-yellow-400 pt-2 mt-2 font-bold text-base">
                                <span>Total:</span>
                                <span className="text-green-600">
                                    {grandTotals.total ? grandTotals.total.toFixed(2) : "0.00"}
                                </span>
                            </div>
                            {dayRanges.map((range) => (
                                <div key={range.id} className="flex justify-between col-span-2 text-amber-700 font-bold">
                                    <span>{range.label}:</span>
                                    <span>{getGrandRangeTotal(data, range.fromDate, range.toDate, rType, false).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    /* =========================================================
       Render tabla agrupada por ciudad
    ========================================================= */
    const renderGroupedTable = (data, days, grandTotals, rType) => {
        const filteredData = filterAndSortGroupedData(data, days, rType);
        return (
            <>
                {/* Vista Desktop */}
                <div className="hidden md:block flex-1 overflow-auto rounded-md">
                    <table className="table w-full">
                        <thead className="bg-primary text-white text-md uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="text-left cursor-pointer select-none" onClick={() => handleSort("poc")}>
                                    POC <SortIcon column="poc" />
                                </th>
                                {days.map((d) => (
                                    <th key={d.date} className="cursor-pointer select-none" onClick={() => handleSort(d.date)}>
                                        <span className="block leading-tight">{d.dayName}</span>
                                        <span className="block font-normal normal-case text-xs opacity-75">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
                                        <SortIcon column={d.date} />
                                    </th>
                                ))}
                                <th className="cursor-pointer select-none" onClick={() => handleSort("total")}>
                                    Total <SortIcon column="total" />
                                </th>
                                <th className="text-center">Gráfica</th>
                                {dayRanges.map((range) => (
                                    <th key={range.id} className="cursor-pointer select-none bg-amber-600" onClick={() => handleSort(range.id)}>
                                        {range.label} <SortIcon column={range.id} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white text-black">
                            {Object.entries(filteredData).map(([cityName, cityData]) => {
                                const cityTotals = getCityTotals(cityData, days, rType);
                                return (
                                    <React.Fragment key={cityName}>
                                        {/* Fila header de la ciudad */}
                                        <tr className="bg-blue-50 font-bold">
                                            <td
                                                colSpan={days.length + 3 + dayRanges.length}
                                                className="uppercase text-blue-800"
                                            >
                                                {cityName}
                                            </td>
                                        </tr>
                                        {/* Filas de POCs */}
                                        {Object.entries(cityData).map(([pocName, pocData]) => {
                                            const total = getPocTotal(pocData, rType);
                                            return (
                                                <tr key={`${cityName}-${pocName}`}>
                                                    <td className="pl-6 font-medium">{pocName}</td>
                                                    {days.map((d) => (
                                                        <td key={d.date} className="text-center">
                                                            {pocData[d.date]?.[rType] != null
                                                                ? pocData[d.date][rType].toFixed(2)
                                                                : "-"}
                                                        </td>
                                                    ))}
                                                    <td className="text-center font-bold">
                                                        {total.toFixed(2)}
                                                    </td>
                                                    <td className="text-center">
                                                        <MiniBarChart pocData={pocData} days={days} rType={rType} />
                                                    </td>
                                                    {dayRanges.map((range) => (
                                                        <td key={range.id} className="text-center font-semibold text-amber-700 bg-amber-50">
                                                            {getPocRangeTotal(pocData, range.fromDate, range.toDate, rType).toFixed(2)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                        {/* Subtotal de la ciudad */}
                                        <tr className="bg-blue-100 font-semibold text-sm">
                                            <td className="pl-6 uppercase">Subtotal {cityName}</td>
                                            {days.map((d) => (
                                                <td key={d.date} className="text-center text-blue-700">
                                                    {cityTotals[d.date]
                                                        ? cityTotals[d.date].toFixed(2)
                                                        : "0.00"}
                                                </td>
                                            ))}
                                            <td className="text-center text-blue-700">
                                                {cityTotals.total
                                                    ? cityTotals.total.toFixed(2)
                                                    : "0.00"}
                                            </td>
                                            <td></td>
                                            {dayRanges.map((range) => (
                                                <td key={range.id} className="text-center text-amber-700 bg-amber-100">
                                                    {getCityRangeTotal(cityData, range.fromDate, range.toDate, rType).toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-yellow-100 font-bold text-black sticky bottom-0">
                            <tr>
                                <td className="text-center uppercase">Total General</td>
                                {days.map((d) => (
                                    <td key={d.date} className="text-center text-blue-600">
                                        {grandTotals[d.date]
                                            ? grandTotals[d.date].toFixed(2)
                                            : "0.00"}
                                    </td>
                                ))}
                                <td className="text-center text-green-600">
                                    {grandTotals.total ? grandTotals.total.toFixed(2) : "0.00"}
                                </td>
                                <td></td>
                                {dayRanges.map((range) => (
                                    <td key={range.id} className="text-center text-amber-700 bg-amber-100">
                                        {getGrandRangeTotal(data, range.fromDate, range.toDate, rType, true).toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Vista Móvil */}
                <div className="md:hidden block flex-1 overflow-auto space-y-4">
                    {Object.entries(filteredData).map(([cityName, cityData]) => (
                        <Accordion key={cityName} variant="contained" defaultValue={cityName}>
                            <Accordion.Item value={cityName}>
                                <Accordion.Control>
                                    <div className="font-bold uppercase">{cityName}</div>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <div className="space-y-3">
                                        {Object.entries(cityData).map(([pocName, pocData]) => {
                                            const total = getPocTotal(pocData, rType);
                                            return (
                                                <div
                                                    key={pocName}
                                                    className="bg-white p-3 rounded-lg border"
                                                >
                                                    <div className="font-bold text-sm mb-2">
                                                        {pocName}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        {days.map((d) => (
                                                            <div
                                                                key={d.date}
                                                                className="flex justify-between"
                                                            >
                                                                <span className="font-semibold">
                                                                    {d.dayName}:
                                                                </span>
                                                                <span>
                                                                    {pocData[d.date]?.[rType] != null
                                                                        ? pocData[d.date][rType].toFixed(2)
                                                                        : "-"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between col-span-2 border-t pt-2 mt-2 font-bold">
                                                            <span>Total:</span>
                                                            <span>{total.toFixed(2)}</span>
                                                        </div>
                                                        {dayRanges.map((range) => (
                                                            <div key={range.id} className="flex justify-between col-span-2 text-amber-700">
                                                                <span className="font-semibold">{range.label}:</span>
                                                                <span className="font-bold">
                                                                    {getPocRangeTotal(pocData, range.fromDate, range.toDate, rType).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                            {days.map((d) => (
                                <div key={d.date} className="flex justify-between">
                                    <span className="font-semibold">{d.dayName}:</span>
                                    <span className="text-blue-600 font-bold">
                                        {grandTotals[d.date]
                                            ? grandTotals[d.date].toFixed(2)
                                            : "0.00"}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between col-span-2 border-t-2 border-yellow-400 pt-2 mt-2 font-bold text-base">
                                <span>Total:</span>
                                <span className="text-green-600">
                                    {grandTotals.total ? grandTotals.total.toFixed(2) : "0.00"}
                                </span>
                            </div>
                            {dayRanges.map((range) => (
                                <div key={range.id} className="flex justify-between col-span-2 text-amber-700 font-bold">
                                    <span>{range.label}:</span>
                                    <span>{getGrandRangeTotal(data, range.fromDate, range.toDate, rType, true).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
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

    const days = getDayColumns();
    const grouped = isGroupedByCity();
    const rType = appliedFilters.reportType;
    const grandTotals = reportData ? getGrandTotals(reportData, days, rType) : {};

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

            {/* ---------------- FILTROS ---------------- */}
            <div className="mb-4 flex-shrink-0">
                {/* Botones de acción */}
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
                                    <div className="mt-3">
                                        <Switch
                                            label="Agrupar por Ciudad"
                                            checked={groupByCity}
                                            onChange={(e) =>
                                                setGroupByCity(e.currentTarget.checked)
                                            }
                                        />
                                    </div>
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

                {/* Filtros normales en desktop */}
                <div className="hidden md:block space-y-3">
                    <div className="flex gap-4 mb-3">
                        <Switch
                            label="Agrupar por Ciudad"
                            checked={groupByCity}
                            onChange={(e) => setGroupByCity(e.currentTarget.checked)}
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
            </div>

            {/* ---------------- BÚSQUEDA LOCAL ---------------- */}
            {reportData && !loading && (
                <div className="mb-3 flex-shrink-0">
                    <TextInput
                        placeholder="Buscar POC..."
                        leftSection={<RiSearchLine />}
                        value={searchPoc}
                        onChange={(e) => setSearchPoc(e.target.value)}
                        rightSection={
                            searchPoc ? (
                                <RiCloseCircleLine
                                    className="cursor-pointer text-gray-400 hover:text-gray-600"
                                    onClick={() => setSearchPoc("")}
                                />
                            ) : null
                        }
                    />
                </div>
            )}

            {/* ---------------- COLUMNAS DE RANGO DE DÍAS ---------------- */}
            {reportData && !loading && days.length > 0 && (
                <div className="mb-3 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="text-sm font-bold text-amber-800 mb-2">Columnas de venta por rango de días</div>
                    <div className="flex flex-wrap gap-2 items-end">
                        <Select
                            label="Desde"
                            placeholder="Día inicio"
                            value={rangeFromDate}
                            onChange={setRangeFromDate}
                            data={days.map((d) => ({ value: d.date, label: `${d.dayName} ${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` }))}
                            size="xs"
                            className="w-32"
                            clearable
                        />
                        <Select
                            label="Hasta"
                            placeholder="Día fin"
                            value={rangeToDate}
                            onChange={setRangeToDate}
                            data={days.filter((d) => !rangeFromDate || d.date >= rangeFromDate).map((d) => ({ value: d.date, label: `${d.dayName} ${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` }))}
                            size="xs"
                            className="w-32"
                            clearable
                        />
                        <Button
                            size="xs"
                            color="orange"
                            leftSection={<RiAddLine />}
                            onClick={() => addDayRange(days)}
                            disabled={!rangeFromDate || !rangeToDate}
                        >
                            Agregar
                        </Button>
                    </div>
                    {dayRanges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {dayRanges.map((range) => (
                                <div
                                    key={range.id}
                                    className="flex items-center gap-1 bg-amber-200 text-amber-900 px-2 py-1 rounded-full text-xs font-semibold"
                                >
                                    <span>{range.label}</span>
                                    <RiCloseCircleLine
                                        className="cursor-pointer hover:text-red-600"
                                        size={14}
                                        onClick={() => removeDayRange(range.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ---------------- TABLA ---------------- */}
            <div className="flex-1 min-h-0 flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader size="lg" />
                    </div>
                ) : reportData && Object.keys(reportData).length > 0 ? (
                    <div
                        id="tableSection"
                        ref={tableSectionRef}
                        className="bg-white mb-4 rounded-lg"
                    >
                        {grouped
                            ? renderGroupedTable(reportData, days, grandTotals, rType)
                            : renderFlatTable(reportData, days, grandTotals, rType)}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        No se encontraron datos para el rango seleccionado.
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
