"use client";
import { useState, useEffect } from "react";
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
import { processSalesReport, getLastSalesUpload } from "@/tada/services/salesReportApi";

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
    const [lastUpload, setLastUpload] = useState(null);
    const [loadingLastUpload, setLoadingLastUpload] = useState(true);

    /* ------------------- EFECTOS ------------------- */
    useEffect(() => {
        const fetchLastUpload = async () => {
            if (!accessToken || !authorized) return;
            
            try {
                const data = await getLastSalesUpload(accessToken);
                setLastUpload(data.last_upload);
            } catch (err) {
                console.error("Error al cargar último upload:", err);
                // No mostramos error al usuario, es información opcional
            } finally {
                setLoadingLastUpload(false);
            }
        };

        fetchLastUpload();
    }, [accessToken, authorized]);

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

    const handleSuccessOverlayClose = async () => {
        setShowSuccessOverlay(false);
        setProcessing(false);
        setExcelFile(null);
        setStats(null);
        
        // Recargar información del último upload
        try {
            const data = await getLastSalesUpload(accessToken);
            setLastUpload(data.last_upload);
        } catch (err) {
            console.error("Error al recargar último upload:", err);
        }
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
                    {/* Información del último archivo cargado */}
                    {!loadingLastUpload && lastUpload && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                📋 Último archivo procesado
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-gray-500">Fecha de procesamiento</p>
                                    <p className="font-medium text-gray-800">
                                        {new Date(lastUpload.date_processed).toLocaleString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Usuario</p>
                                    <p className="font-medium text-gray-800">{lastUpload.user}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Rango de fechas</p>
                                    <p className="font-medium text-gray-800">
                                        {new Date(lastUpload.initrowdate).toLocaleDateString('es-ES')} - {new Date(lastUpload.endrowdate).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Registros procesados</p>
                                    <p className="font-medium text-gray-800">{lastUpload.rows_count.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {loadingLastUpload && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Loader size="xs" />
                                <p className="text-xs text-gray-500">Cargando información...</p>
                            </div>
                        </div>
                    )}

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
                            {stats.hasErrors && (
                                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                                    <p className="text-sm font-semibold text-yellow-800 text-center">
                                        ⚠️ El archivo Excel incluye una hoja con registros con errores
                                    </p>
                                </div>
                            )}
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
                                {stats.recordsUnprocessed > 0 && (
                                    <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-red-300">
                                        <p className="text-xs text-gray-500 mb-1">Registros con Errores</p>
                                        <p className="text-xl md:text-2xl font-bold text-red-600">
                                            {stats.recordsUnprocessed}
                                        </p>
                                    </div>
                                )}
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
                            {stats.hasErrors && (
                                <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                                    <p className="text-xs text-blue-800">
                                        📊 El archivo Excel descargado contiene:
                                    </p>
                                    <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc">
                                        <li><strong>Hoja 1: "Registros Nuevos"</strong> - Registros procesados exitosamente</li>
                                        <li><strong>Hoja 2: "Registros con Errores"</strong> - Registros con errores para revisar</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ProcessingOverlay
                isProcessing={processing}
                showSuccess={showSuccessOverlay}
                successMessage={
                    stats?.hasErrors
                        ? "¡Archivo procesado! Revisa la hoja de errores en el Excel descargado"
                        : "¡Archivo procesado y descargado exitosamente!"
                }
                processingMessage="Procesando el reporte de ventas..."
                onSuccessClose={handleSuccessOverlayClose}
            />
        </div>
    );
}
