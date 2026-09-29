"use client";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, NAV_GROUPS } from "../navigation";
import "./_sidebar.scss";

interface SidebarProps {
  /** Вызывается при переходе — мобильное меню по нему закрывается. */
  onNavigate?: () => void;
}

/** Разделы приложения, сгруппированные по смыслу. */
export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  return (
    <nav className="sidebar" aria-label="Разделы">
      {NAV_GROUPS.map((group) => (
        <List
          key={group.title}
          dense
          subheader={
            <ListSubheader disableSticky className="sidebar__group">
              {group.title}
            </ListSubheader>
          }
        >
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                selected={active}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className="sidebar__link"
              >
                <ListItemIcon className="sidebar__icon">
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            );
          })}
        </List>
      ))}
    </nav>
  );
}
