import API_BASE_URL from "@/config/apiConfig";
import { Report } from "@/tada/interfaces/pocs";

export const createReport = async (
  message: Report,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/tada/pocs/report/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });

  const returned = await response.json();
  // console.log(returned);
  return returned;
};
