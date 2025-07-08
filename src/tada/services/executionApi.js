import API_BASE_URL from "@/config/apiConfig";

export const listExecutionLogsStats = async (
  accessToken,
  page,
  start_date,
  end_date
) => {
  const params = new URLSearchParams({ page: page.toString() });

  if (start_date) {
    params.append("start_date", start_date);
  }
  if (end_date) {
    params.append("end_date", end_date);
  }

  const response = await fetch(
    `${API_BASE_URL}/tada/execution-logs/stats/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener estadísticas de execution logs");
  }

  return await response.json();
};
