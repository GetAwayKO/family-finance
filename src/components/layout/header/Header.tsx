"use client";

import { Menu } from "@mui/icons-material";
import "./_header.scss";
import React from "react";
interface Header {
  title: string;
  showSidebarHandler: () => void;
}

export default function Header({ title, showSidebarHandler }: Header) {
  return (
    <header>
      <button onClick={onMenuClick} className="menu-btn">
        <Menu></Menu>
      </button>
      <div className="title">
        <h1>{title}</h1>
      </div>
      <div className="menu">
        <span>Кнопка</span>
        <span>Кнопка</span>
        <span>Кнопка</span>
      </div>
    </header>
  );
  function onMenuClick(event: React.MouseEvent<HTMLButtonElement>): void {
    showSidebarHandler();
  }
}
