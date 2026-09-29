"use client";
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import Main from "@/components/layout/main/Main";
import AuthGate from "@/shared/auth/AuthGate";
import { useAuth } from "@/shared/auth/AuthProvider";
import { ReactNode } from "react";
import "./_main_layout.scss";
interface LayoutType {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutType) {
  const { status } = useAuth();
  return (
    <div className="layout">
      <Header title={"CA$H FLOW"} showNav={status === "authenticated"} />
      <Main>
        <AuthGate>{children}</AuthGate>
      </Main>
      <Footer />
    </div>
  );
}
