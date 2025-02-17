"use client";

import { useState } from "react";
import { Button, Notification, Loader } from "@mantine/core";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { createReport } from "@/services/pocsApi";
import { useAuth } from "@/hooks/useAuth";
import { Report, ReportResult } from "@/interfaces/pocs";

export default function ReportPage() {
  const { accessToken } = useAuth();
  const [reportData, setReportData] = useState<ReportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentimentColors = {
    Positivo: "#4F9F85",
    Negativo: "#E95F76",
    Neutral: "#95a5a6", // Gris
  };

  // Input "quemado" para el reporte
  const reportInput: Report = {
    pocs: [
      {
        name: "Tada Alborada",
        POC_NAME: "TADA ALBORADA",
        ruta_archivo: "./chats/alborada.txt",
      },
      {
        name: "Tada Sangolqui",
        POC_NAME: "+593 96 239 8472",
        ruta_archivo: "./chats/sangolqui.txt",
      },
    ],
    fecha_inicio: "2024-04-01",
    fecha_fin: "2025-12-31",
  };

  const getMonthName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", { month: "long" }).toUpperCase(); // Devuelve el nombre del mes en español
  };

  const loadReport = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createReport(reportInput, accessToken);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      <Button
        className="btn btn-info text-white"
        onClick={loadReport}
        disabled={loading}
      >
        {loading ? "Cargando reporte..." : "Generar Reporte"}
      </Button>

      {loading && (
        <div className="mt-4">
          <Loader />
        </div>
      )}

      {/* Una vez cargado el reporte se muestran las gráficas */}
      {reportData.length > 0 && (
        <div className="mt-6 grid gap-6">
          {reportData.map((report) => {
            const chartData = report.dates.map((dateObj) => ({
              period: getMonthName(dateObj.start),
              score: Math.round(dateObj.score), // Score sin decimales
              positivo: Math.round(
                dateObj.sentiment_distribution?.Positivo || 0
              ), // En porcentaje
              negativo: Math.round(
                dateObj.sentiment_distribution?.Negativo || 0
              ), // En porcentaje
              neutral: Math.round(dateObj.sentiment_distribution?.Neutral || 0), // En porcentaje
            }));

            return (
              <div key={report.name} className="card bg-base-100 shadow-xl p-4">
                <h2 className="text-lg font-bold text-center mb-4">
                  Reporte para: {report.name || report.poc}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />

                    {/* Score en la parte superior de la barra */}
                    <Bar dataKey="score" fill="transparent">
                      <LabelList
                        dataKey="score"
                        position="top"
                        fill="black"
                        fontSize={16}
                        fontWeight="bold"
                        formatter={(value) => `${value} PT`}
                      />
                    </Bar>

                    {/* Barras de sentimientos */}
                    <Bar
                      dataKey="negativo"
                      stackId="a"
                      fill={sentimentColors.Negativo}
                    >
                      <LabelList
                        dataKey="negativo"
                        position="inside"
                        fill="white"
                        fontSize={12}
                        fontWeight="bold"
                        formatter={(value) => `${value}%`}
                      />
                    </Bar>
                    <Bar
                      dataKey="neutral"
                      stackId="a"
                      fill={sentimentColors.Neutral}
                    >
                      <LabelList
                        dataKey="neutral"
                        position="inside"
                        fill="white"
                        fontSize={12}
                        fontWeight="bold"
                        formatter={(value) => `${value}%`}
                      />
                    </Bar>
                    <Bar
                      dataKey="positivo"
                      stackId="a"
                      fill={sentimentColors.Positivo}
                    >
                      <LabelList
                        dataKey="positivo"
                        position="inside"
                        fill="white"
                        fontSize={12}
                        fontWeight="bold"
                        formatter={(value) => `${value}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
