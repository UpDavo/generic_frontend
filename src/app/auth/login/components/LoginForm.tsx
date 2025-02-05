/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/features/auth/authSlice";
import { login } from "@/services/authApi";
import { useRouter } from "next/navigation";
import { Button, TextInput, Container, Alert } from "@mantine/core";
import { validateEmail } from "@/utils/validateEmail";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }

    try {
      const data = await login(email, password);
      if (data.access && data.refresh) {
        dispatch(
          loginSuccess({
            user: email,
            access: data.access,
            refresh: data.refresh,
          })
        );
        router.push("/dashboard");
      } else {
        setError("Invalid login credentials");
      }
    } catch (err) {
      setError("An error occurred while logging in. Please try again.");
    }
  };

  return (
    <Container fluid className="w-full">
      {error && (
        <Alert color="red" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
        >
          Login
        </Button>
      </form>
    </Container>
  );
}
