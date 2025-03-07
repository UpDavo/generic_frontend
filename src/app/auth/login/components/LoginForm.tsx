"use client";

import { useState } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { loginUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Button,
  TextInput,
  Container,
  Notification,
  Loader,
} from "@mantine/core";
import { validateEmail } from "@/utils/validateEmail";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Cambié a string | null
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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
      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred while logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="w-full">
      {error && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setError(null)} // Permite cerrar la notificación
        >
          {error}
        </Notification>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
          required
          className="w-full"
          error={emailError}
        />
        <TextInput
          label="Password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full"
          error={passwordError}
        />
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          className={`py-2 rounded-lg ${
            loading ? "bg-gray-400" : "bg-primary hover:bg-info"
          } text-white flex justify-center items-center gap-2`}
        >
          {loading ? <Loader size="sm" color="white" /> : "Login"}
        </Button>
      </form>
    </Container>
  );
}
