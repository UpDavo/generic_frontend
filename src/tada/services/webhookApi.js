import API_BASE_URL from "@/config/apiConfig";

export const listWebhookLogs = async (
  accessToken,
  page,
  email,
  startDate,
  endDate,
  source
) => {
  const params = new URLSearchParams({ page: page.toString() });

  if (email) {
    params.append("email", email);
  }
  if (startDate) {
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("end_date", endDate);
  }
  if (source) {
    params.append("source", source);
  }

  const response = await fetch(
    `${API_BASE_URL}/tada/webhook/cancelled/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los logs de webhooks");
  }

  return await response.json();
};

export const listWebhookLogsReport = async (
  accessToken,
  email,
  startDate,
  endDate,
  source
) => {
  const params = new URLSearchParams();

  if (email) {
    params.append("email", email);
  }
  if (startDate) {
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("end_date", endDate);
  }
  if (source) {
    params.append("source", source);
  }

  const response = await fetch(
    `${API_BASE_URL}/tada/webhook/cancelled/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener el reporte de webhooks");
  }

  const data = await response.json();
  return data.results || [];
};

export const downloadWebhookLogsExcel = async (
  accessToken,
  email,
  startDate,
  endDate,
  source
) => {
  const params = new URLSearchParams();

  if (email) params.append("email", email);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (source) params.append("source", source);

  const response = await fetch(
    `${API_BASE_URL}/tada/webhook/cancelled/download/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) throw new Error("Error al descargar el Excel");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // yyyy-mm-dd
  a.download = `webhook_logs_${formattedDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
