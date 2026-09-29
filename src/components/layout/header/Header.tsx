"use client";

import { Menu } from "@mui/icons-material";
import "./_header.scss";
import React from "react";
interface Header {
  title: string;
}

export default function Header({ title }: Header) {
  return (
    <header>
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
}
