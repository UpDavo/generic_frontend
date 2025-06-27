import API_BASE_URL from "@/config/apiConfig";
import axios from "axios";

export const login = async (email: string, password: string) => {
  try {
    // console.log(email, password);
    // console.log(`${API_BASE_URL}/auth/login/`);
    const response = await axios.post(
      `${API_BASE_URL}/auth/login/`,
      { email, password },
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    console.error("Error en login:", error);
    throw new Error("Error en autenticación");
  }
};

export const logout = async (accessToken: string | null) => {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/logout/`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    console.error("Error en logout:", error);
  }
};

export const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh/`,
      {},
      { withCredentials: true }
    );

    return {
      accessToken: response.data.access_token,
      user: response.data.user,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error("Error al refrescar el token:", error);
    return null; // O throw, según prefieras
  }
};
