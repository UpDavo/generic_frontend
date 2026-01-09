"use client";
import { useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import { RiCheckLine, RiFileExcel2Line } from "react-icons/ri";

/**
 * ProcessingOverlay
 * Componente que muestra un overlay de pantalla completa durante el procesamiento
 * Incluye:
 * - Loader animado
 * - Tiempo transcurrido
 * - Mensaje de éxito al finalizar
 */
export function ProcessingOverlay({
    isProcessing = false,
    showSuccess = false,
    successMessage = "¡Procesamiento completado exitosamente!",
    processingMessage = "Procesando archivo, por favor espera...",
    onSuccessClose,
    successDuration = 3000,
}) {
    const [elapsedTime, setElapsedTime] = useState(0);

    // Contador de tiempo transcurrido
    useEffect(() => {
        if (isProcessing) {
            setElapsedTime(0);
            const interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isProcessing]);

    // Auto-cerrar el mensaje de éxito
    useEffect(() => {
        if (showSuccess) {
            const timeout = setTimeout(() => {
                onSuccessClose?.();
            }, successDuration);

            return () => clearTimeout(timeout);
        }
    }, [showSuccess, onSuccessClose, successDuration]);

    // Formatear tiempo transcurrido
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (!isProcessing && !showSuccess) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[9999] flex items-center justify-center"
            style={{ margin: 0 }}
        >
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 text-center animate-fade-in">
                {isProcessing ? (
                    <>
                        {/* Loader */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative">
                                <Loader size="xl" color="blue" />
                                <RiFileExcel2Line className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-green-600 animate-pulse" />
                            </div>
                        </div>

                        {/* Mensaje */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                            Procesando...
                        </h2>
                        <p className="text-gray-600 mb-6">{processingMessage}</p>

                        {/* Tiempo transcurrido */}
                        <div className="bg-gray-100 rounded-lg py-4 px-6">
                            <p className="text-sm text-gray-500 mb-1">Tiempo transcurrido</p>
                            <p className="text-3xl font-mono font-bold text-blue-600">
                                {formatTime(elapsedTime)}
                            </p>
                        </div>

                        {/* Barra de progreso animada */}
                        <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full animate-progress-bar"></div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Mensaje de éxito */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
                                <RiCheckLine className="text-5xl text-green-600" />
                            </div>
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                            ¡Éxito!
                        </h2>
                        <p className="text-gray-600 mb-2">{successMessage}</p>
                        <p className="text-sm text-gray-500">
                            Tiempo total: {formatTime(elapsedTime)}
                        </p>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes scale-in {
                    0% {
                        transform: scale(0);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                @keyframes progress-bar {
                    0% {
                        width: 0%;
                    }
                    50% {
                        width: 70%;
                    }
                    100% {
                        width: 100%;
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }

                .animate-scale-in {
                    animation: scale-in 0.5s ease-out;
                }

                .animate-progress-bar {
                    animation: progress-bar 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
