/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { loginUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button, TextInput, Container, Alert } from "@mantine/core";
import { validateEmail } from "@/utils/validateEmail";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const dispatch = useAppDispatch();
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
      await dispatch(loginUser(email, password));
      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred while logging in. Please try again.");
    }
  };

  return (
    <Container className="w-full">
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
          className="bg-primary hover:bg-info text-white py-2 rounded-lg"
        >
          Login
        </Button>
      </form>
    </Container>
  );
}
