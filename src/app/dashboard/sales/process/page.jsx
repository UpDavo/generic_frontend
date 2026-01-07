"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    Button,
    Loader,
    Notification,
    FileInput,
    Modal,
} from "@mantine/core";
import {
    RiUploadCloudLine,
    RiDownloadCloudLine,
    RiFileExcel2Line,
    RiCheckLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import { processSalesReport, downloadFileFromUrl } from "@/tada/services/salesReportApi";

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
    const [success, setSuccess] = useState(false);
    const [result, setResult] = useState(null);
    const [resultModalOpen, setResultModalOpen] = useState(false);

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
        setSuccess(false);
        setResult(null);

        try {
            const response = await processSalesReport(accessToken, excelFile);
            setResult(response);
            setSuccess(true);
            setResultModalOpen(true);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al procesar el archivo");
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadResult = () => {
        if (result?.excel_url) {
            downloadFileFromUrl(result.excel_url, "resultado_procesado.xlsx");
        }
    };

    const handleReset = () => {
        setExcelFile(null);
        setResult(null);
        setSuccess(false);
        setError(null);
        setResultModalOpen(false);
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

            {success && !resultModalOpen && (
                <Notification color="green" className="mb-4 w-full md:max-w-2xl" onClose={() => setSuccess(false)}>
                    ¡Archivo procesado exitosamente!
                </Notification>
            )}

            <div className="card bg-white shadow-xl p-4 md:p-8 w-full md:max-w-2xl">
                <div className="flex items-center justify-center mb-4 md:mb-6">
                    <RiFileExcel2Line className="text-4xl md:text-6xl text-green-600" />
                </div>

                <h1 className="text-xl md:text-3xl font-bold text-center mb-2">
                    Procesamiento de Reporte de Ventas
                </h1>
                <p className="text-center text-sm md:text-base text-gray-600 mb-6 md:mb-8">
                    Sube un archivo Excel para procesar y obtener los resultados
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

                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        <Button
                            fullWidth
                            size="md"
                            onClick={handleProcessFile}
                            loading={processing}
                            disabled={!excelFile || processing}
                            leftSection={processing ? null : <RiCheckLine />}
                            color="blue"
                        >
                            {processing ? "Procesando..." : "Procesar Archivo"}
                        </Button>

                        {result && (
                            <Button
                                fullWidth
                                size="md"
                                onClick={handleReset}
                                variant="outline"
                                disabled={processing}
                            >
                                Nuevo Archivo
                            </Button>
                        )}
                    </div>

                    {processing && (
                        <div className="flex flex-col items-center justify-center py-6 md:py-8">
                            <Loader size="lg" color="blue" />
                            <p className="mt-4 text-sm md:text-base text-gray-600 animate-pulse text-center">
                                Procesando archivo, por favor espera...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ---------------- MODAL DE RESULTADOS ---------------- */}
            <Modal
                opened={resultModalOpen}
                onClose={() => setResultModalOpen(false)}
                title="Resultados del Procesamiento"
                centered
                size="lg"
                className="text-black"
                fullScreen={{ base: true, sm: false }}
            >
                {result && (
                    <div className="space-y-4 md:space-y-6 text-black">
                        <div className="alert alert-success">
                            <RiCheckLine className="text-xl md:text-2xl" />
                            <span className="text-sm md:text-base">¡Procesamiento completado exitosamente!</span>
                        </div>

                        {/* JSON Result */}
                        {result.json_result && (
                            <div>
                                <h3 className="font-bold text-base md:text-lg mb-2">Resultado JSON:</h3>
                                <div className="bg-gray-100 p-3 md:p-4 rounded-lg overflow-auto max-h-64 md:max-h-96">
                                    <pre className="text-xs md:text-sm">
                                        {JSON.stringify(result.json_result, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Excel Download */}
                        {result.excel_url && (
                            <div>
                                <h3 className="font-bold text-base md:text-lg mb-2">Archivo Excel Resultante:</h3>
                                <Button
                                    fullWidth
                                    onClick={handleDownloadResult}
                                    leftSection={<RiDownloadCloudLine />}
                                    color="green"
                                    size="md"
                                >
                                    Descargar Excel Procesado
                                </Button>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                            <Button
                                fullWidth
                                onClick={() => setResultModalOpen(false)}
                                variant="outline"
                                size="md"
                            >
                                Cerrar
                            </Button>
                            <Button
                                fullWidth
                                onClick={handleReset}
                                color="blue"
                                size="md"
                            >
                                Procesar Otro Archivo
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
