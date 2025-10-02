import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import Main from "@/components/layout/main/Main";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import { ReactElement, ReactNode } from "react";

interface LayoutType {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutType) {
  return (
    <>
      <Header title={"Cash flow"} />
      <Sidebar />
      <Main>{children}</Main>
      <Footer />
    </>
  );
}
