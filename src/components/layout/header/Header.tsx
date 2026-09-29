"use client";

import MenuIcon from "@mui/icons-material/Menu";
import { Avatar, IconButton } from "@mui/material";
import Link from "next/link";
import Logo from "../logo/Logo";
import "./_header.scss";

interface HeaderProps {
  title: string;
  /** Меню и профиль показываем только вошедшему пользователю. */
  showNav?: boolean;
  userName?: string;
  /** Открыть меню разделов на узком экране. */
  onMenuClick?: () => void;
}

export default function Header({
  title,
  showNav = true,
  userName,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__start">
        {showNav && (
          <IconButton
            className="header__menu-button"
            aria-label="Открыть меню"
            onClick={onMenuClick}
            edge="start"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Link href="/home" className="header__logo">
          <Logo label={title} />
        </Link>
      </div>
      {showNav && userName && (
        <Link href="/profile" className="header__user" title="Профиль">
          <span className="header__user-name">{userName}</span>
          <Avatar className="header__avatar">
            {userName.trim().charAt(0).toUpperCase()}
          </Avatar>
        </Link>
      )}
    </header>
  );
}
