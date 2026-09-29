"use client";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/shared/auth/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();
  return <AuthForm mode="register" onSubmit={register} />;
}
