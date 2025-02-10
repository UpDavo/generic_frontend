import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, AuthState } from "@/interfaces/user";

const initialState: AuthState = {
  user:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null,
  accessToken:
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  refreshToken:
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        tokens: { access: string; refresh: string };
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.access;
      state.refreshToken = action.payload.tokens.refresh;

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("accessToken", action.payload.tokens.access);
        localStorage.setItem("refreshToken", action.payload.tokens.refresh);
      }
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },

    updateUserState: (state, action: PayloadAction<User>) => {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
});

export const { loginSuccess, logout, updateUserState } = authSlice.actions;
export default authSlice.reducer;
