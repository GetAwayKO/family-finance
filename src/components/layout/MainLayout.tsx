"use client";
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import Main from "@/components/layout/main/Main";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import { ReactNode, useState } from "react";
import "./_main_layout.scss";
interface LayoutType {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutType) {
  const [showSidebar, setShowSidebar] = useState(false);
  return (
    <>
      <Header
        title={"CA$H FLOW"}
        showSidebarHandler={() => {
          setShowSidebar((prev) => !prev);
        }}
      />
      <div className="content">
        <Sidebar show={showSidebar} />
        <Main>{children}</Main>
      </div>
      <Footer />
    </>
  );
}
