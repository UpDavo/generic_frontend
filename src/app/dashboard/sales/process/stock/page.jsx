"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    Button,
    Loader,
    Notification,
    FileInput,
    NumberInput,
    Select,
} from "@mantine/core";
import {
    RiUploadCloudLine,
    RiFileExcel2Line,
    RiCheckLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import { processStockReport } from "@/tada/services/stockReportApi";

const PERMISSION_PATH = "/dashboard/sales/process/stock";

const MONTHS = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
];

export default function StockProcessPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized] = useState(() => {
        return (
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH)
        );
    });

    /* ------------------- ESTADO ------------------- */
    const [excelFile, setExcelFile] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

    /* =========================================================
       Handlers
    ========================================================= */
    const handleProcessFile = async () => {
        if (!excelFile) {
            setError("Por favor selecciona un archivo Excel");
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            await processStockReport(accessToken, excelFile, year || null, month ? parseInt(month) : null);
            setShowSuccessOverlay(true);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al procesar el archivo");
            setProcessing(false);
        }
    };

    const handleSuccessOverlayClose = () => {
        setShowSuccessOverlay(false);
        setProcessing(false);
        setExcelFile(null);
        setYear(new Date().getFullYear());
        setMonth(String(new Date().getMonth() + 1));
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
        <div className="text-black h-full flex flex-col md:items-center md:justify-center p-4 md:p-8">
            {error && (
                <Notification color="red" className="mb-4 w-full md:max-w-2xl" onClose={() => setError(null)}>
                    {error}
                </Notification>
            )}

            <div className="card bg-white shadow-xl p-4 md:p-8 w-full md:max-w-2xl">
                <div className="flex items-center justify-center mb-4 md:mb-6">
                    <RiFileExcel2Line className="text-4xl md:text-6xl text-green-600" />
                </div>

                <h1 className="text-xl md:text-3xl font-bold text-center mb-2">
                    Inventario Teórico por POC
                </h1>
                <p className="text-center text-sm md:text-base text-gray-600 mb-2">
                    Sube el Excel con las hojas <strong>Inventario PT</strong>, <strong>Inventario EN</strong> y <strong>Pedido</strong>
                </p>
                <p className="text-center text-xs md:text-sm text-gray-500 mb-6 md:mb-8">
                    El período se inicializa con el mes y año actual — ajústalo si necesitas procesar otro período
                </p>

                <div className="space-y-4 md:space-y-5">
                    {/* Período opcional */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Período
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <NumberInput
                                label="Año"
                                placeholder="Año"
                                min={2020}
                                max={2100}
                                value={year ?? ""}
                                onChange={(val) => setYear(val || null)}
                                disabled={processing}
                                size="sm"
                            />
                            <Select
                                label="Mes"
                                placeholder="Mes actual"
                                data={MONTHS}
                                value={month}
                                onChange={setMonth}
                                disabled={processing}
                                clearable
                                size="sm"
                            />
                        </div>
                    </div>

                    <FileInput
                        label="Archivo Excel"
                        placeholder="Selecciona un archivo Excel (.xlsx / .xls)"
                        accept=".xlsx,.xls"
                        value={excelFile}
                        onChange={setExcelFile}
                        leftSection={<RiUploadCloudLine />}
                        size="md"
                        disabled={processing}
                    />

                    <Button
                        fullWidth
                        size="md"
                        onClick={handleProcessFile}
                        loading={processing}
                        disabled={!excelFile || processing}
                        leftSection={processing ? null : <RiCheckLine />}
                        color="green"
                    >
                        {processing ? "Procesando..." : "Procesar y Descargar"}
                    </Button>

                    {processing && (
                        <div className="flex flex-col items-center justify-center py-6 md:py-8">
                            <Loader size="lg" color="green" />
                            <p className="mt-4 text-sm md:text-base text-gray-600 animate-pulse text-center">
                                Calculando inventario teórico, por favor espera...
                            </p>
                        </div>
                    )}
                </div>

                {/* Descripción del resultado */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 font-semibold mb-2">
                        El Excel descargado contiene 2 hojas:
                    </p>
                    <ul className="text-xs text-green-700 ml-4 list-disc space-y-1">
                        <li><strong>Hoja 1: Resumen por POC</strong> — Ciudad, Cliente, POC, Pedido $, HLS, Inv PT, Inv EN, Costo Total, Límite Garantía, Revisar (ALERTA/OK), Cobertura %</li>
                        <li><strong>Hoja 2: Días de Inventario</strong> — Detalle por POC + SKU con días calculados</li>
                    </ul>
                </div>
            </div>

            <ProcessingOverlay
                isProcessing={processing}
                showSuccess={showSuccessOverlay}
                successMessage="¡Inventario teórico procesado y descargado exitosamente!"
                processingMessage="Calculando inventario teórico..."
                onSuccessClose={handleSuccessOverlayClose}
            />
        </div>
    );
}
