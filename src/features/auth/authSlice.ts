import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, AuthState } from "@/interfaces/user";

const initialState: AuthState = {
  user:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User | null;
        accessToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },

    logoutSuccess: (state) => {
      state.user = null;
      state.accessToken = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
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

export const { loginSuccess, logoutSuccess, updateUserState } = authSlice.actions;
export default authSlice.reducer;
