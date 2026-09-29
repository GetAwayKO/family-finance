"use client";
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import Main from "@/components/layout/main/Main";
import { ReactNode } from "react";
import "./_main_layout.scss";
interface LayoutType {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutType) {
  // const [showSidebar, setShowSidebar] = useState(false);
  return (
    <div className="layout">
      <Header title={"CA$H FLOW"} />
      <Main>{children}</Main>
      <Footer />
    </div>
  );
}
