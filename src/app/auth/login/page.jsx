"use client";

import { useState, useEffect, use } from "react";
import { useAppDispatch } from "@/core/hooks/useAppDispatch";
import { loginUser, useAuth } from "@/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button, TextInput, Notification, Loader } from "@mantine/core";
import { validateEmail } from "@/core/utils/validateEmail";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { user } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    } else {
      setCheckingAuth(false);
    }
  }, [user, router]);

  if (checkingAuth) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailError("");
    setPasswordError("");

    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      await dispatch(loginUser(email, password));
      // Si loginUser lanza error, se captura abajo
      router.push("/dashboard");
    } catch (err) {
      // Si el backend responde con error, muestra mensaje adecuado
      if (
        err?.response?.status === 401 ||
        err?.message?.toLowerCase().includes("invalid")
      ) {
        setError("Email o contraseña incorrectos");
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center bg-transparent">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 w-full max-w-md p-6 rounded-xl shadow-lg bg-white"
      >
        <div className="text-center mb-4 mt-4">
          <h1 className="text-6xl font-bold mb-2">HINT</h1>
          <h1 className="text-2xl mb-6">Iniciar Sesión</h1>
        </div>
        {error && (
          <Notification
            color="red"
            className="mb-4"
            onClose={() => setError(null)}
          >
            {error}
          </Notification>
        )}
        <TextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
          required
          className="w-full text-black"
          error={emailError}
        />
        <TextInput
          label="Password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full text-black"
          error={passwordError}
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? <Loader size="sm" color="white" /> : "Login"}
        </Button>
        {/* <div className="flex justify-center">
          <a
            href="/auth/forgot"
            className="text-sm text-primary hover:underline"
          >
            Olvidé mi contraseña
          </a>
        </div> */}
      </form>
    </div>
  );
}
