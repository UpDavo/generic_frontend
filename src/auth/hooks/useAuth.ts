import { RootState } from "@/core/store";
import { useSelector } from "react-redux";
import { AppDispatch } from "@/core/store";
import { login, logout, refreshToken } from "@/auth/services/authApi";
import { loginSuccess, logoutSuccess } from "@/auth/redux/authSlice";

export const useAuth = () => {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  return { user, accessToken };
};

export const loginUser =
  (email: string, password: string) => async (dispatch: AppDispatch) => {
    try {
      const data = await login(email, password);
      // Elimina persistencia del accessToken en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      dispatch(
        loginSuccess({ user: data.user, accessToken: data.access_token })
      );
    } catch (error) {
      console.error(error);
    }
  };

export const logoutUser =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const { accessToken } = getState().auth;
      await logout(accessToken);
      // Limpia storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      dispatch(logoutSuccess());
    } catch (error) {
      console.error("Error al hacer logout:", error);
    }
  };

export const refreshAccessToken = () => async (dispatch: AppDispatch) => {
  try {
    // `data` contendrá { accessToken, user }
    const data = await refreshToken();

    if (data && data.accessToken && data.user) {
      dispatch(
        loginSuccess({
          user: data.user,
          accessToken: data.accessToken,
        })
      );
    } else {
      dispatch(logoutSuccess());
    }
  } catch (error) {
    console.error(error);
    dispatch(logoutSuccess());
  }
};
