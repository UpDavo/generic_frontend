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

export const logoutUser = () => async (dispatch: AppDispatch) => {
  await logout();
  dispatch(logoutSuccess());
};


export const refreshAccessToken = () => async (dispatch: AppDispatch) => {
  const newToken = await refreshToken();
  const { user } = useSelector((state: RootState) => state.auth);
  if (newToken) {
    dispatch(loginSuccess({ user: user, accessToken: newToken }));
  } else {
    dispatch(logoutSuccess());
  }
};
