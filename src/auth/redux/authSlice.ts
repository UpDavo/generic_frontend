import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, AuthState } from "@/core/interfaces/user";

const initialState: AuthState = {
  user: null, // Solo en memoria, no hidratar desde localStor
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
      // Si el usuario tiene permissions en la raíz, asegúrate de guardarlo
      if (action.payload.user && action.payload.user.permissions) {
        state.user = {
          ...action.payload.user,
          permissions: action.payload.user.permissions,
        };
      } else {
        state.user = action.payload.user;
      }
      state.accessToken = action.payload.accessToken;
      // Elimina persistencia en localStorage para accessToken
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
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

export const { loginSuccess, logoutSuccess, updateUserState } =
  authSlice.actions;
export default authSlice.reducer;
