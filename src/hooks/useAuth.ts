import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { login, logout, refreshToken } from "@/services/authApi";
import { loginSuccess, logoutSuccess } from "@/features/auth/authSlice";

export const useAuth = () => {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  return { user, accessToken };
};

export const loginUser =
  (email: string, password: string) => async (dispatch: AppDispatch) => {
    try {
      const data = await login(email, password);
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
