"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    Button,
    Loader,
    Notification,
    FileInput,
} from "@mantine/core";
import {
    RiUploadCloudLine,
    RiFileExcel2Line,
    RiCheckLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import { ProcessingOverlay } from "@/core/components/ProcessingOverlay";
import { processSalesReport } from "@/tada/services/salesReportApi";

const PERMISSION_PATH = "/dashboard/sales/process";

export default function SalesProcessPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useState(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user, router]);

    /* ------------------- ESTADO ------------------- */
    const [excelFile, setExcelFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [stats, setStats] = useState(null);

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
            const statistics = await processSalesReport(accessToken, excelFile);
            setStats(statistics);
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
        setStats(null);
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
                    Procesamiento de Reporte de Ventas
                </h1>
                <p className="text-center text-sm md:text-base text-gray-600 mb-2">
                    Sube un archivo Excel para procesar y obtener los resultados
                </p>
                <p className="text-center text-xs md:text-sm text-gray-500 mb-6 md:mb-8">
                    ⏱️ Los archivos grandes pueden demorar de 3 a 4 minutos en procesarse
                </p>

                <div className="space-y-4 md:space-y-6">
                    <FileInput
                        label="Archivo Excel"
                        placeholder="Selecciona un archivo Excel"
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
                        color="blue"
                    >
                        {processing ? "Procesando..." : "Procesar y Descargar"}
                    </Button>

                    {processing && (
                        <div className="flex flex-col items-center justify-center py-6 md:py-8">
                            <Loader size="lg" color="blue" />
                            <p className="mt-4 text-sm md:text-base text-gray-600 animate-pulse text-center">
                                Procesando archivo, por favor espera...
                            </p>
                        </div>
                    )}

                    {stats && !processing && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">
                                Estadísticas del Procesamiento
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">Registros Nuevos</p>
                                    <p className="text-xl md:text-2xl font-bold text-green-600">
                                        {stats.recordsCreated}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">Registros Actualizados</p>
                                    <p className="text-xl md:text-2xl font-bold text-blue-600">
                                        {stats.recordsUpdated}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">Duplicados Ignorados</p>
                                    <p className="text-xl md:text-2xl font-bold text-orange-600">
                                        {stats.recordsDuplicated}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">Total Procesado</p>
                                    <p className="text-xl md:text-2xl font-bold text-purple-600">
                                        {stats.totalProcessed}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm col-span-2 md:col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">Tiempo de Procesamiento</p>
                                    <p className="text-xl md:text-2xl font-bold text-gray-700">
                                        {stats.processingTime.toFixed(2)}s
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ProcessingOverlay
                isProcessing={processing}
                showSuccess={showSuccessOverlay}
                successMessage="¡Archivo procesado y descargado exitosamente!"
                processingMessage="Procesando el reporte de ventas..."
                onSuccessClose={handleSuccessOverlayClose}
            />
        </div>
    );
}
