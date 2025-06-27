"use client";

import { useState, useEffect } from "react";
import { Button, TextInput, Notification, Loader } from "@mantine/core";
import { validateEmail } from "@/core/utils/validateEmail";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: aviso, 3: nueva contraseña
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();

  // Inicia el contador cuando se entra al paso 3
  useEffect(() => {
    if (step === 3 && !success) {
      setResendTimer(60);
      setCanResend(false);
    }
  }, [step, success]);

  // Maneja el countdown
  useEffect(() => {
    if (step === 3 && !success && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 3 && !success && resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, step, success]);

  const handleSendEmail = (e) => {
    e.preventDefault();
    setEmailError("");
    if (!validateEmail(email)) {
      setEmailError("Formato de email inválido");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1200); // Simula petición
  };

  // Paso 2: mostrar aviso y botón para ir a código
  const handleGoToCode = () => {
    setStep(3);
  };

  const handleResendCode = () => {
    setCanResend(false);
    setResendTimer(60);
    // Aquí simularías el reenvío del código
  };

  // Paso 3: ingresar código y nueva contraseña
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError("");
    if (!password || password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 1800);
    }, 1200); // Simula petición
  };

  return (
    <div className="w-full flex justify-center bg-transparent">
      <div className="space-y-5 w-full max-w-md p-6 rounded-xl shadow-lg bg-white">
        <div className="text-center mb-4 mt-4">
          <h1 className="text-6xl font-bold mb-2 text-black">HINT</h1>
          <h1 className="text-2xl mb-6 text-black">Recuperar contraseña</h1>
        </div>
        {step === 1 && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <TextInput
              label="Email"
              placeholder="Ingresa tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
              className="w-full text-black"
              error={emailError}
            />
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? <Loader size="sm" color="white" /> : "Siguiente"}
            </Button>
          </form>
        )}
        {step === 2 && (
          <div className="space-y-6 text-center">
            <p className="text-lg text-black">
              Se enviará un código de confirmación a <b>{email}</b>.<br />
              Por favor revisa tu correo electrónico y haz clic en siguiente para continuar.
            </p>
            <Button fullWidth onClick={handleGoToCode}>
              Siguiente
            </Button>
          </div>
        )}
        {step === 3 && !success && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <TextInput
              label="Código de confirmación"
              placeholder="Ingresa el código recibido"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full text-black"
            />
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {canResend
                  ? "¿No recibiste el código? "
                  : `Puedes reenviar el código en ${resendTimer}s`}
              </span>
              {canResend && (
                <Button size="xs" variant="light" onClick={handleResendCode} type="button">
                  Reenviar código
                </Button>
              )}
            </div>
            <TextInput
              label="Nueva contraseña"
              placeholder="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-black"
            />
            <TextInput
              label="Confirmar contraseña"
              placeholder="Repite la nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full text-black"
              error={passwordError}
            />
            {passwordError && (
              <Notification color="red" className="mb-2" onClose={() => setPasswordError("")}>{passwordError}</Notification>
            )}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? <Loader size="sm" color="white" /> : "Actualizar contraseña"}
            </Button>
          </form>
        )}
        {success && (
          <Notification color="green" className="text-center text-lg">
            Contraseña actualizada con éxito. Puedes iniciar sesión.<br />Redirigiendo al login...
          </Notification>
        )}
      </div>
    </div>
  );
}
