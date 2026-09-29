"use client";
import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";
import Main from "@/components/layout/main/Main";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import AuthGate from "@/shared/auth/AuthGate";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Drawer } from "@mui/material";
import { ReactNode, useState } from "react";
import Logo from "./logo/Logo";
import "./_main_layout.scss";
interface LayoutType {
  children: ReactNode;
}

const TITLE = "CA$H FLOW";

export default function MainLayout({ children }: LayoutType) {
  const { status, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const showNav = status === "authenticated";
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={showNav ? "layout layout--nav" : "layout"}>
      <Header
        title={TITLE}
        showNav={showNav}
        userName={user?.name}
        onMenuClick={() => setMenuOpen(true)}
      />
      {showNav && (
        <>
          <aside className="layout__sidebar">
            <Sidebar />
          </aside>
          {/* На узких экранах те же разделы открываются выдвижной панелью */}
          <Drawer
            open={menuOpen}
            onClose={closeMenu}
            slotProps={{ paper: { className: "layout__drawer" } }}
          >
            <div className="layout__drawer-logo">
              <Logo label={TITLE} />
            </div>
            <Sidebar onNavigate={closeMenu} />
          </Drawer>
        </>
      )}
      <div className="layout__body">
        <Main>
          <AuthGate>{children}</AuthGate>
        </Main>
        <Footer />
      </div>
    </div>
  );
}
