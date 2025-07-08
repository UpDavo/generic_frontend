"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDateTimeVariation,
  sendReportEmail,
} from "@/tada/services/reportsApi";
import { createDailyMeta, updateDailyMeta } from "@/tada/services/dailyMetaApi";
import {
  TextInput,
  Loader,
  Notification,
  Button,
  Select,
  NumberInput,
  Modal,
} from "@mantine/core";
import {
  RiRefreshLine,
  RiSearchLine,
  RiMailSendLine,
  RiAddLine,
  RiEditLine,
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";

const PERMISSION_PATH = "/dashboard/reports/traffic";

export default function TrafficReportPage() {
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(null);

  // Estados para el modal de crear meta
  const [createMetaModalOpen, setCreateMetaModalOpen] = useState(false);
  const [editMetaModalOpen, setEditMetaModalOpen] = useState(false);
  const [metaFormData, setMetaFormData] = useState({
    target_count: "",
  });
  const [createMetaLoading, setCreateMetaLoading] = useState(false);
  const [editMetaLoading, setEditMetaLoading] = useState(false);

  // Función para obtener el día por defecto basado en la hora actual
  const getDefaultDay = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Si son las 5 AM o más tarde, usar el día actual
    if (currentHour >= 5) {
      return now.getDay() || 7; // 1=Lunes, 7=Domingo
    } else {
      // Si son antes de las 5 AM, usar el día anterior
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return yesterday.getDay() || 7;
    }
  };

  // Parámetros de filtro
  const [dia, setDia] = useState(getDefaultDay());
  const [startWeek, setStartWeek] = useState("");
  const [endWeek, setEndWeek] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(3);

  // Opciones para el select de días
  const dayOptions = [
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" },
    { value: "7", label: "Domingo" },
  ];

  /* ------------------------- AUTORIZACIÓN ------------------------- */
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
    setAuthorized(!!hasPermission);
  }, [user]);

  /* ------------------------- FETCH FUNCTIONS ---------------------- */
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getDateTimeVariation(
        accessToken,
        dia,
        startWeek || null,
        endWeek || null,
        year,
        startHour,
        endHour
      );

      console.log("Fetched report data:", data);

      setReportData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Error al cargar el reporte de tráfico");
    } finally {
      setLoading(false);
    }
  }, [accessToken, dia, startWeek, endWeek, year, startHour, endHour]);

  const sendEmail = useCallback(async () => {
    setEmailLoading(true);
    setError(null);
    setEmailSuccess(null);

    try {
      const response = await sendReportEmail(
        accessToken,
        dia,
        startWeek || null,
        endWeek || null,
        year,
        startHour,
        endHour
      );

      setEmailSuccess(response.message);
    } catch (err) {
      console.error("Error sending email:", err);
      setError("Error al enviar el reporte por email");
    } finally {
      setEmailLoading(false);
    }
  }, [accessToken, dia, startWeek, endWeek, year, startHour, endHour]);

  // Función para crear meta diaria
  const createMeta = useCallback(async () => {
    setCreateMetaLoading(true);
    setError(null);
    setEmailSuccess(null);

    try {
      // Obtener la fecha del día seleccionado para la semana actual
      const currentDate = new Date();
      const currentWeekStart = new Date(
        currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)
      );

      // Ajustar al día seleccionado (1=Lunes, 7=Domingo)
      const targetDate = new Date(currentWeekStart);
      const dayOffset = dia === 7 ? 6 : dia - 1; // Domingo = 6, Lunes = 0
      targetDate.setDate(currentWeekStart.getDate() + dayOffset);

      const dateString = targetDate.toISOString().split("T")[0];

      const metaData = {
        date: dateString,
        target_count: parseInt(metaFormData.target_count),
      };

      await createDailyMeta(accessToken, metaData);
      setEmailSuccess("Meta creada exitosamente");
      setCreateMetaModalOpen(false);
      setMetaFormData({ target_count: "" });

      // Recargar los datos del reporte
      fetchReportData();
    } catch (err) {
      console.error("Error creating meta:", err);
      setError("Error al crear la meta diaria");
    } finally {
      setCreateMetaLoading(false);
    }
  }, [accessToken, dia, metaFormData.target_count, fetchReportData]);

  // Función para editar meta diaria
  const editMeta = useCallback(async () => {
    setEditMetaLoading(true);
    setError(null);
    setEmailSuccess(null);

    try {
      const metaData = {
        target_count: parseInt(metaFormData.target_count),
      };

      // Obtener el meta_id desde reportData directamente
      const metaId = reportData?.data?.daily_meta_vs_real?.meta_id;

      if (!metaId) {
        throw new Error("No se encontró el ID de la meta");
      }

      await updateDailyMeta(accessToken, metaId, metaData);
      setEmailSuccess("Meta actualizada exitosamente");
      setEditMetaModalOpen(false);
      setMetaFormData({ target_count: "" });

      // Recargar los datos del reporte
      fetchReportData();
    } catch (err) {
      console.error("Error updating meta:", err);
      setError("Error al actualizar la meta diaria");
    } finally {
      setEditMetaLoading(false);
    }
  }, [
    accessToken,
    reportData?.data?.daily_meta_vs_real?.meta_id,
    metaFormData.target_count,
    fetchReportData,
  ]);

  // Función para abrir el modal de edición
  const openEditMetaModal = useCallback(() => {
    const currentMetaCount = reportData?.data?.daily_meta_vs_real?.meta_count;
    setMetaFormData({
      target_count: currentMetaCount?.toString() || "",
    });
    setEditMetaModalOpen(true);
  }, [reportData?.data?.daily_meta_vs_real?.meta_count]);

  // Cargar datos iniciales cuando el usuario esté autorizado
  useEffect(() => {
    if (authorized && accessToken) {
      fetchReportData();
    }
  }, [authorized, accessToken, fetchReportData]);

  // No cargar datos iniciales, solo cuando se presione buscar

  /* ------------------------- RENDER ------------------------------- */
  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-8 bg-white rounded-md shadow-lg">
        <p className="text-center text-red-500 font-bold">
          No tienes autorización para ver esta sección.
        </p>
      </div>
    );
  }

  const dailyMeta = reportData?.data?.daily_meta_vs_real;
  const dailyVariation = reportData?.data?.daily_variation;
  const hourlyData = reportData?.data?.hourly_data || [];
  const metadata = reportData?.metadata;

  // Obtener las semanas disponibles de los datos
  const weekNumbers =
    hourlyData.length > 0
      ? Object.keys(hourlyData[0].semanas).sort(
          (a, b) => parseInt(a) - parseInt(b)
        )
      : [];

  return (
    <div className="text-black">
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-4">
          Reporte de Tráfico por Hora
        </h1>

        {metadata && (
          <div className="text-center text-lg">
            <p>
              <strong>Día:</strong> {metadata.dia_nombre}
            </p>
            <p>
              <strong># Órdenes:</strong> {dailyMeta?.real_count || 0}
            </p>
          </div>
        )}
      </div>

      {/* ------------- FILTROS ------------- */}
      <div className="grid md:grid-cols-7 grid-cols-1 gap-4 mb-6 text-black items-end">
        <Select
          label="Día de la semana"
          value={dia.toString()}
          onChange={(value) => setDia(parseInt(value))}
          data={dayOptions}
        />

        <NumberInput
          label="Semana inicio"
          placeholder="Ej: 24"
          value={startWeek}
          onChange={(value) => setStartWeek(value)}
          min={1}
          max={53}
        />

        <NumberInput
          label="Semana fin"
          placeholder="Ej: 28"
          value={endWeek}
          onChange={(value) => setEndWeek(value)}
          min={1}
          max={53}
        />

        <NumberInput
          label="Año"
          value={year}
          onChange={(value) => setYear(value)}
          min={2020}
          max={2030}
        />

        <Button
          onClick={fetchReportData}
          variant="filled"
          leftSection={<RiSearchLine />}
          disabled={loading}
          className="btn-primary"
        >
          Buscar
        </Button>

        <Button
          onClick={() => {
            setDia(getDefaultDay());
            setStartWeek("");
            setEndWeek("");
            setYear(new Date().getFullYear());
            setStartHour(7);
            setEndHour(3);
          }}
          variant="filled"
          leftSection={<RiRefreshLine />}
          disabled={loading}
          className="btn-secondary"
        >
          Reiniciar
        </Button>

        <Button
          onClick={sendEmail}
          variant="filled"
          leftSection={<RiMailSendLine />}
          disabled={emailLoading || !accessToken}
          className="btn-success"
        >
          {emailLoading ? "Enviando..." : "Enviar Email"}
        </Button>
      </div>

      {/* ------------- ERRORES Y NOTIFICACIONES ------------- */}
      {error && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Notification>
      )}

      {emailSuccess && (
        <Notification
          color="green"
          className="mb-4"
          onClose={() => setEmailSuccess(null)}
          withCloseButton
        >
          {emailSuccess}
        </Notification>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-2 text-gray-600">Cargando reporte...</p>
          </div>
        </div>
      ) : reportData ? (
        <>
          {/* ------------- TARJETAS DE RESUMEN ------------- */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-6">
            {/* Meta diaria vs Real */}
            <div className="card bg-white shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-center">
                Meta Diaria vs Real
              </h3>
              {dailyMeta?.meta_count ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Real:</span>
                    <span className="text-blue-600 font-bold">
                      {dailyMeta?.real_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Meta:</span>
                    <span className="text-green-600 font-bold">
                      {dailyMeta?.meta_count || 0}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Logro:</span>
                      <span
                        className={`font-bold text-2xl ${
                          (dailyMeta?.achievement_percentage || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {dailyMeta?.achievement_percentage?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (dailyMeta?.achievement_percentage || 0) >= 0
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.abs(dailyMeta?.achievement_percentage || 0),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <Button
                    onClick={openEditMetaModal}
                    leftSection={<RiEditLine />}
                    variant="filled"
                    className="btn-secondary"
                    fullWidth
                  >
                    Editar Meta
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Real:</span>
                    <span className="text-blue-600 font-bold">
                      {dailyMeta?.real_count || 0}
                    </span>
                  </div>
                  <div className="text-gray-500 mb-4">
                    No hay meta configurada para este día
                  </div>
                  <Button
                    onClick={() => setCreateMetaModalOpen(true)}
                    leftSection={<RiAddLine />}
                    variant="filled"
                    className="btn-primary"
                    fullWidth
                  >
                    Agregar Meta
                  </Button>
                </div>
              )}
            </div>

            {/* Variación Diaria */}
            <div className="card bg-white shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-center">
                Variación Diaria
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Semana Actual:</span>
                  <span className="text-blue-600 font-bold">
                    {dailyVariation?.current_week_total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Semana Anterior:</span>
                  <span className="text-gray-600 font-bold">
                    {dailyVariation?.previous_week_total || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Variación:</span>
                    <span
                      className={`font-bold text-2xl ${
                        (dailyVariation?.variation_percentage || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {dailyVariation?.variation_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (dailyVariation?.variation_percentage || 0) >= 0
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(dailyVariation?.variation_percentage || 0),
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------- TABLA DE DATOS POR HORA ------------- */}
          <div className="card bg-white shadow-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-center">
              Datos por Hora - {metadata?.dia_nombre}
            </h3>

            {/* Vista de escritorio - Tabla */}
            <div className="hidden md:block overflow-x-auto rounded-md">
              <table className="table w-full">
                <thead className="bg-primary text-white text-md uppercase font-bold">
                  <tr>
                    <th>Hora</th>
                    {weekNumbers.map((week) => (
                      <th key={week}>Semana {week}</th>
                    ))}
                    <th>Variación %</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-black">
                  {hourlyData.map((hour, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="font-bold">{hour.hora}</td>
                      {weekNumbers.map((week) => (
                        <td key={week} className="text-center">
                          {hour.semanas[week] || 0}
                        </td>
                      ))}
                      <td className="text-center">
                        <div className="space-y-1">
                          <div
                            className={`font-bold ${
                              hour.variacion >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {hour.variacion}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${
                                hour.variacion >= 0
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Math.abs(hour.variacion || 0),
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="md:hidden block space-y-4">
              {hourlyData.map((hour, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
                >
                  <div className="mb-3">
                    <div className="text-lg font-bold text-center">
                      {hour.hora}
                    </div>
                    <div className="space-y-1">
                      <div
                        className={`text-center font-bold ${
                          hour.variacion >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Variación: {hour.variacion}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            hour.variacion >= 0 ? "bg-green-600" : "bg-red-600"
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.abs(hour.variacion || 0),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {weekNumbers.map((week) => (
                      <div key={week} className="text-center">
                        <div className="text-xs text-gray-600">
                          Semana {week}
                        </div>
                        <div className="font-semibold">
                          {hour.semanas[week] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ------------- MODAL PARA CREAR META DIARIA ------------- */}
          <Modal
            opened={createMetaModalOpen}
            onClose={() => setCreateMetaModalOpen(false)}
            title="Crear Meta Diaria"
            classNames={{ modal: "rounded-lg" }}
          >
            <div className="space-y-4">
              <TextInput
                label="Cantidad objetivo"
                placeholder="Ej: 100"
                value={metaFormData.target_count}
                onChange={(e) =>
                  setMetaFormData({
                    ...metaFormData,
                    target_count: e.target.value,
                  })
                }
                type="number"
                min={1}
                required
              />

              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => setCreateMetaModalOpen(false)}
                  variant="outline"
                  className="btn-secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createMeta}
                  variant="filled"
                  loading={createMetaLoading}
                  className="btn-primary"
                >
                  Crear Meta
                </Button>
              </div>
            </div>
          </Modal>

          {/* ------------- MODAL PARA EDITAR META DIARIA ------------- */}
          <Modal
            opened={editMetaModalOpen}
            onClose={() => setEditMetaModalOpen(false)}
            title="Editar Meta Diaria"
            classNames={{ modal: "rounded-lg" }}
          >
            <div className="space-y-4">
              <TextInput
                label="Cantidad objetivo"
                placeholder="Ej: 100"
                value={metaFormData.target_count}
                onChange={(e) =>
                  setMetaFormData({
                    ...metaFormData,
                    target_count: e.target.value,
                  })
                }
                type="number"
                min={1}
                required
              />

              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => setEditMetaModalOpen(false)}
                  variant="outline"
                  className="btn-secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editMeta}
                  variant="filled"
                  loading={editMetaLoading}
                  className="btn-primary"
                >
                  Actualizar Meta
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
}
