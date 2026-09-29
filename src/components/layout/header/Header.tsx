"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./_header.scss";

interface HeaderProps {
  title: string;
  /** Разделы показываем только вошедшему пользователю. */
  showNav?: boolean;
}

export const NAV_ITEMS = [
  { href: "/home", label: "Главная" },
  { href: "/transactions", label: "Операции" },
  { href: "/accounts", label: "Счета" },
  { href: "/categories", label: "Категории" },
  { href: "/family", label: "Семья" },
  { href: "/profile", label: "Профиль" },
];

export default function Header({ title, showNav = true }: HeaderProps) {
  const pathname = usePathname();
  return (
    <header>
      <div className="title">
        <h1>{title}</h1>
      </div>
      {showNav && (
        <nav className="menu">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={
                  active ? "menu__link menu__link--active" : "menu__link"
                }
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
