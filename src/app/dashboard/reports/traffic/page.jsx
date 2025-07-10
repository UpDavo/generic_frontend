"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Accordion,
} from "@mantine/core";
import {
  RiRefreshLine,
  RiSearchLine,
  RiMailSendLine,
  RiAddLine,
  RiEditLine,
  RiDownloadLine,
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import html2canvas from "html2canvas";

const PERMISSION_PATH = "/dashboard/reports/traffic";

export default function TrafficReportPage() {
  const { accessToken, user } = useAuth();

  // Ref para capturar la sección del reporte
  const reportSectionRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(null);
  const [downloadingImage, setDownloadingImage] = useState(false);

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

      // console.log("Fetched report data:", data);

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
        date: reportData?.data?.daily_meta_vs_real?.date || null,
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
    reportData?.data?.daily_meta_vs_real?.date,
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

  // Función para descargar imagen del reporte
  const downloadReportImage = useCallback(async () => {
    if (!reportSectionRef.current) return;

    setDownloadingImage(true);
    setError(null);

    try {
      // Configuración mejorada para capturar tablas correctamente
      const canvas = await html2canvas(reportSectionRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Escala aumentada para mejor calidad
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 20000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        onclone: (clonedDoc, element) => {
          // Aplicar estilos específicos para mejorar la captura
          const style = clonedDoc.createElement("style");
          style.textContent = `
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            /* Estilos para la tabla */
            table { 
              width: 100% !important; 
              border-collapse: collapse !important;
              table-layout: fixed !important;
            }
            th, td { 
              border: 1px solid #e5e7eb !important;
              padding: 8px !important;
              text-align: center !important;
              word-wrap: break-word !important;
              vertical-align: middle !important;
            }
            thead th {
              background-color: #18181b !important;
              color: #ffffff !important;
              font-weight: bold !important;
              font-size: 12px !important;
            }
            tbody td {
              background-color: #ffffff !important;
              color: #000000 !important;
              font-size: 11px !important;
            }
            
            /* Estilos específicos para las barras de progreso */
            .progress-container {
              width: 100% !important;
              margin: 4px 0 !important;
            }
            .progress-bar-bg {
              width: 100% !important;
              height: 6px !important;
              background-color: #e5e7eb !important;
              border-radius: 3px !important;
            }
            .progress-bar-fill {
              height: 6px !important;
              border-radius: 3px !important;
              transition: none !important;
            }
            
            /* Ocultar elementos responsivos problemáticos */
            .md\\:hidden { display: none !important; }
            .hidden { display: none !important; }
            .md\\:block { display: block !important; }
            
            /* Colores específicos */
            .bg-primary { background-color: #18181b !important; }
            .text-primary { color: #18181b !important; }
            .bg-green-600 { background-color: #16a34a !important; }
            .text-green-600 { color: #16a34a !important; }
            .bg-red-600 { background-color: #dc2626 !important; }
            .text-red-600 { color: #dc2626 !important; }
            .bg-gray-500 { background-color: #6b7280 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .bg-blue-600 { background-color: #2563eb !important; }
            .text-blue-600 { color: #2563eb !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .bg-white { background-color: #ffffff !important; }
            .text-black { color: #000000 !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
            
            /* Estilos para las cards */
            .card { 
              background-color: #ffffff !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 8px !important;
              padding: 24px !important;
              margin-bottom: 24px !important;
            }
            
            /* Remover efectos hover y transiciones */
            * { transition: none !important; }
            .hover\\:bg-gray-50:hover { background-color: #ffffff !important; }
          `;
          clonedDoc.head.appendChild(style);

          // Ocultar elementos con data-html2canvas-ignore
          const elementsToHide = clonedDoc.querySelectorAll(
            "[data-html2canvas-ignore]"
          );
          elementsToHide.forEach((el) => {
            el.style.display = "none";
          });

          // Forzar que la tabla sea visible y tenga el tamaño correcto
          const tables = clonedDoc.querySelectorAll("table");
          tables.forEach((table) => {
            table.style.display = "table";
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";

            // Asegurar que las celdas tengan el tamaño correcto
            const cells = table.querySelectorAll("th, td");
            cells.forEach((cell) => {
              cell.style.padding = "8px";
              cell.style.border = "1px solid #e5e7eb";
              cell.style.textAlign = "center";
            });
          });

          // Asegurar que los elementos tengan colores válidos
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const computedStyle = window.getComputedStyle(el);

            // Forzar colores RGB básicos
            if (computedStyle.backgroundColor) {
              if (
                computedStyle.backgroundColor.includes("oklch") ||
                computedStyle.backgroundColor.includes("transparent")
              ) {
                el.style.backgroundColor = "#ffffff";
              }
            }
            if (computedStyle.color) {
              if (computedStyle.color.includes("oklch")) {
                el.style.color = "#000000";
              }
            }
          });
        },
      });

      // Convertir canvas a blob con buena calidad
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          // Generar nombre de archivo descriptivo
          const now = new Date();
          const dateStr = now.toISOString().split("T")[0];
          const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
          const dayName =
            dayOptions.find((d) => d.value === dia.toString())?.label || "Dia";
          const weekRange =
            startWeek && endWeek ? `_S${startWeek}-${endWeek}` : "";

          link.download = `reporte-trafico-${dayName}${weekRange}_${year}_${dateStr}_${timeStr}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setEmailSuccess("Imagen del reporte descargada exitosamente");
        },
        "image/jpeg",
        0.95
      );
    } catch (err) {
      console.error("Error downloading report image:", err);
      setError("Error al descargar la imagen del reporte. Intenta nuevamente.");
    } finally {
      setDownloadingImage(false);
    }
  }, [dia, dayOptions, startWeek, endWeek, year]);

  // Cargar datos iniciales una sola vez cuando el usuario esté autorizado
  useEffect(() => {
    if (authorized && accessToken) {
      fetchReportData();
    }
  }, [authorized, accessToken]); // Removido fetchReportData de las dependencias

  // Los datos solo se cargarán al inicio y cuando se presione buscar

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

  // Calcular la variación semanal basada en la última hora con datos
  const calculateWeeklyVariation = () => {
    const lastHour = dailyMeta?.last_hour_with_data;
    if (!lastHour || hourlyData.length === 0 || weekNumbers.length < 2) {
      return {
        currentWeekValue: 0,
        previousWeekValue: 0,
        variationPercentage: 0,
      };
    }

    // Encontrar los datos de la última hora registrada
    const lastHourData = hourlyData.find((hour) => hour.hora === lastHour);
    if (!lastHourData) {
      return {
        currentWeekValue: 0,
        previousWeekValue: 0,
        variationPercentage: 0,
      };
    }

    // Obtener la semana actual y anterior
    const currentWeek = weekNumbers[weekNumbers.length - 1];
    const previousWeek = weekNumbers[weekNumbers.length - 2];

    const currentWeekValue = lastHourData.semanas[currentWeek] || 0;
    const previousWeekValue = lastHourData.semanas[previousWeek] || 0;

    // Usar directamente el campo variacion de esa hora
    const variationPercentage = lastHourData.variacion || 0;

    return {
      currentWeekValue,
      previousWeekValue,
      variationPercentage,
    };
  };

  const weeklyVariation = calculateWeeklyVariation();

  return (
    <div className="text-black">
      {/* Título */}
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold text-center mb-6">
          Reporte de Tráfico
        </h1>

        {metadata && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-40 my-5 text-center text-base md:text-lg">
            <div className="">
              <p className="text-gray-600 text-sm mb-1">Última Hora</p>
              <p className="font-bold text-lg text-gray-800">
                {dailyMeta?.last_hour_with_data || "N/A"}
              </p>
            </div>
            <div className="">
              <p className="text-gray-600 text-sm mb-1">Total Órdenes</p>
              <p className="font-bold text-lg text-blue-600">
                {dailyMeta?.real_count || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ------------- FILTROS EN ACCORDION ------------- */}
      <Accordion variant="contained" className="mb-6 border-white">
        <Accordion.Item
          value="filters"
          className="bg-white border-white shadow-md rounded-lg"
        >
          <Accordion.Control>
            <span className="font-medium text-gray-800">
              Filtros del Reporte
            </span>
          </Accordion.Control>
          <Accordion.Panel className="bg-white rounded-b-lg">
            {/* Fila de filtros */}
            <div className="grid md:grid-cols-4 grid-cols-1 gap-4 mb-4 text-black">
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
            </div>

            {/* Fila de botones */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button
                onClick={fetchReportData}
                variant="filled"
                leftSection={<RiSearchLine />}
                disabled={loading}
                className="btn-primary"
                size="compact-md"
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
                  // Refrescar los datos después de reiniciar los filtros
                  setTimeout(() => {
                    fetchReportData();
                  }, 100);
                }}
                variant="outline"
                leftSection={<RiRefreshLine />}
                disabled={loading}
                className="border-gray-400 text-gray-700 hover:bg-gray-50"
                size="compact-md"
              >
                Reiniciar
              </Button>

              <Button
                onClick={sendEmail}
                variant="filled"
                leftSection={<RiMailSendLine />}
                disabled={emailLoading || !accessToken}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="compact-md"
              >
                {emailLoading ? "Enviando..." : "Enviar Email"}
              </Button>

              <Button
                onClick={downloadReportImage}
                variant="filled"
                leftSection={<RiDownloadLine />}
                disabled={downloadingImage || !reportData}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="compact-md"
              >
                {downloadingImage ? "Descargando..." : "Descargar Imagen"}
              </Button>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

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
          {/* ------------- SECCIÓN CAPTURABLE DEL REPORTE ------------- */}
          <div ref={reportSectionRef}>
            {/* ------------- TARJETAS DE RESUMEN ------------- */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              {/* Meta diaria vs Real */}
              <div className="card bg-white shadow-lg p-6">
                {dailyMeta?.meta_count ? (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Título con botón */}
                    <div className="flex flex-col items-left">
                      <h3 className="text-md font-bold">
                        Meta
                        <br />
                        Diaria
                      </h3>
                      <Button
                        onClick={openEditMetaModal}
                        variant="filled"
                        leftSection={<RiEditLine />}
                        className="btn btn-sm mt-2"
                        size="compact-xs"
                        data-html2canvas-ignore
                      >
                        Editar
                      </Button>
                    </div>

                    {/* #Órdenes */}
                    <div className="text-center">
                      <span className="text-sm text-gray-600 block">
                        #Órdenes
                      </span>
                      <span className="text-blue-600 font-bold text-lg">
                        {dailyMeta?.real_count || 0}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="text-center">
                      <span className="text-sm text-gray-600 block">Meta</span>
                      <span className="text-green-600 font-bold text-lg">
                        {dailyMeta?.meta_count || 0}
                      </span>
                    </div>

                    {/* Cumplimiento con barra */}
                    <div className="flex-1 min-w-[200px] max-w-[300px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          Cumplimiento
                        </span>
                        <span
                          className={`font-bold text-lg ${
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
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Título con botón */}
                    <div className="flex flex-col items-center">
                      <h3 className="text-md font-bold">Meta Diaria</h3>
                      <Button
                        onClick={() => setCreateMetaModalOpen(true)}
                        leftSection={<RiAddLine />}
                        variant="filled"
                        className="btn btn-sm mt-2"
                        size="sm"
                        data-html2canvas-ignore
                      >
                        Agregar Meta
                      </Button>
                    </div>

                    {/* #clearÓrdenes */}
                    <div className="text-center">
                      <span className="text-sm text-gray-600 block">
                        #Órdenes
                      </span>
                      <span className="text-blue-600 font-bold text-lg">
                        {dailyMeta?.real_count || 0}
                      </span>
                    </div>

                    {/* Meta no configurada */}
                    <div className="text-center">
                      <span className="text-sm text-gray-600 block">Meta</span>
                      <span className="text-gray-500 font-bold text-lg">
                        No configurada
                      </span>
                    </div>

                    {/* Espacio para cumplimiento */}
                    <div className="flex-1 min-w-[200px] max-w-[300px]">
                      <div className="text-center text-gray-500">
                        Configure una meta para ver el cumplimiento
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Variación Diaria */}
              <div className="card bg-white shadow-lg p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Título */}
                  <h3 className="text-md font-bold">
                    Variación
                    <br />
                    Semanal
                    <br />
                    <span className="text-xs font-normal text-gray-500">
                      (a las {dailyMeta?.last_hour_with_data || "N/A"})
                    </span>
                  </h3>

                  {/* Semana Actual */}
                  <div className="text-center">
                    <span className="text-sm text-gray-600 block">Actual</span>
                    <span className="text-blue-600 font-bold text-lg">
                      {weeklyVariation.currentWeekValue}
                    </span>
                  </div>

                  {/* Semana Anterior */}
                  <div className="text-center">
                    <span className="text-sm text-gray-600 block">
                      Anterior
                    </span>
                    <span className="text-gray-600 font-bold text-lg">
                      {weeklyVariation.previousWeekValue}
                    </span>
                  </div>

                  {/* Variación con barra */}
                  <div className="flex-1 min-w-[200px] max-w-[300px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Variación</span>
                      <span
                        className={`font-bold text-lg ${
                          weeklyVariation.variationPercentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {weeklyVariation.variationPercentage >= 0 ? "+" : ""}
                        {weeklyVariation.variationPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          weeklyVariation.variationPercentage >= 0
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.abs(weeklyVariation.variationPercentage),
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
            <div className="mb-8">
              {/* Vista de escritorio - Tabla */}
              <div className="hidden md:block overflow-x-auto rounded-xl shadow-lg">
                <table
                  className="w-full text-xs bg-white"
                  style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.875rem)" }}
                >
                  <thead className="bg-primary text-white uppercase font-bold">
                    <tr>
                      <th className="px-2 py-1 text-center min-w-[50px]">
                        Hora
                      </th>
                      {weekNumbers.map((week) => (
                        <th
                          key={week}
                          className="px-1 py-1 text-center min-w-[40px]"
                        >
                          S.{week}
                        </th>
                      ))}
                      <th className="px-2 py-1 text-center min-w-[70px]">
                        Var.%
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-black">
                    {hourlyData.map((hour, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 border-b border-gray-200 border-opacity-50 ${
                          index % 2 === 0 ? "bg-gray-25" : "bg-white"
                        }`}
                      >
                        <td className="font-bold px-2 py-1 text-center">
                          {hour.hora}
                        </td>
                        {weekNumbers.map((week) => (
                          <td key={week} className="text-center px-1 py-1">
                            {hour.semanas[week] || 0}
                          </td>
                        ))}
                        <td className="text-center px-2 py-1">
                          <div className="space-y-1">
                            <div
                              className={`font-bold text-xs ${
                                hour.variacion === -100
                                  ? "text-gray-500"
                                  : hour.variacion >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {hour.variacion}%
                            </div>
                            <div className="w-full">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    hour.variacion === -100
                                      ? "bg-gray-500"
                                      : hour.variacion >= 0
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
                            hour.variacion === -100
                              ? "text-gray-500"
                              : hour.variacion >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          Variación: {hour.variacion}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              hour.variacion === -100
                                ? "bg-gray-500"
                                : hour.variacion >= 0
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
            {/* ------------- FIN SECCIÓN CAPTURABLE ------------- */}

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
          </div>
          {/* ------------- FIN SECCIÓN CAPTURABLE ------------- */}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
}
