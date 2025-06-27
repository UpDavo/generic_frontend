"use client";
import { Container } from "@mantine/core";

export default function AuthLayout({ children }) {
  return (
    <div className="flex items-center justify-center h-screen bg-base-content">
      <Container
        fluid
        className="flex flex-col items-center justify-center px-4 py-10 w-full text-primary"
      >
        {children}
      </Container>
    </div>
  );
}
