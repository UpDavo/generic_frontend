"use client";
import React, { useEffect, useState, createContext } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/core/store";
import { useAppDispatch } from "@/core/hooks/useAppDispatch";
import { refreshAccessToken } from "@/auth/hooks/useAuth";
import { Loader, Text, Container, MantineProvider } from "@mantine/core";
import { getThemeFromCSS } from "@/core/utils/getThemeFromCss";

export const AuthLoadingContext = createContext(true);

function AuthLoader({ children }) {
  const dispatch = useAppDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      await dispatch(refreshAccessToken());
      setCheckingAuth(false);
    })();
  }, [dispatch]);

  if (checkingAuth) {
    return (
      <Container className="flex flex-col items-center justify-center h-screen">
        <Loader size="xl" variant="bars" color="black" />
        <Text className="mt-4 text-xl">Cargando sesión...</Text>
      </Container>
    );
  }

  return (
    <AuthLoadingContext.Provider value={!checkingAuth}>
      {children}
    </AuthLoadingContext.Provider>
  );
}

export default function Providers({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    setTheme(getThemeFromCSS());
  }, []);

  return (
    <MantineProvider theme={theme || { colorScheme: "light" }}>
      <ReduxProvider store={store}>
        <AuthLoader>{children}</AuthLoader>
      </ReduxProvider>
    </MantineProvider>
  );
}
