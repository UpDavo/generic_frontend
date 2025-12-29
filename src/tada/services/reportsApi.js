import API_BASE_URL from "@/config/apiConfig";

export const getDateTimeVariation = async (
  accessToken,
  dia,
  start_week = null,
  end_week = null,
  start_year = null,
  end_year = null,
  start_hour = null,
  end_hour = null
) => {
  const params = new URLSearchParams({ dia: dia.toString() });

  if (start_week) params.append("start_week", start_week.toString());
  if (end_week) params.append("end_week", end_week.toString());
  if (start_year) params.append("start_year", start_year.toString());
  if (end_year) params.append("end_year", end_year.toString());
  if (start_hour) params.append("start_hour", start_hour.toString());
  if (end_hour) params.append("end_hour", end_hour.toString());

  const response = await fetch(
    `${API_BASE_URL}/tada/reports/datetime-variation/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener reporte de variación");
  }

  return await response.json();
};

export const sendReportEmail = async (
  accessToken,
  dia,
  start_week = null,
  end_week = null,
  start_year = null,
  end_year = null,
  start_hour = null,
  end_hour = null
) => {
  const params = new URLSearchParams({ dia: dia.toString() });

  if (start_week) params.append("start_week", start_week.toString());
  if (end_week) params.append("end_week", end_week.toString());
  if (start_year) params.append("start_year", start_year.toString());
  if (end_year) params.append("end_year", end_year.toString());
  if (start_hour) params.append("start_hour", start_hour.toString());
  if (end_hour) params.append("end_hour", end_hour.toString());

  const response = await fetch(
    `${API_BASE_URL}/tada/reports/send-email/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al enviar notificación");
  }

  return await response.json();
};

export const manualFetchData = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/tada/reports/fetch-data/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener datos del reporte");
  }

  return await response.json();
};
