import API_BASE_URL from "../config/apiConfig";
import axios from "axios";

export const login = async (email: string, password: string) => {
  try {
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

export const logout = async () => {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/logout/`,
      {},
      { withCredentials: true }
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

    return response.data.access_token;
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    return null;
  }
};
