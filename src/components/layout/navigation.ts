import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import EventRepeatOutlined from "@mui/icons-material/EventRepeatOutlined";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import PieChartOutline from "@mui/icons-material/PieChartOutline";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export interface NavItem {
  href: string;
  label: string;
  icon: SvgIconComponent;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Обзор",
    items: [{ href: "/home", label: "Главная", icon: DashboardOutlined }],
  },
  {
    title: "Деньги",
    items: [
      { href: "/transactions", label: "Операции", icon: ReceiptLongOutlined },
      { href: "/accounts", label: "Счета", icon: AccountBalanceWalletOutlined },
      { href: "/categories", label: "Категории", icon: CategoryOutlined },
    ],
  },
  {
    title: "Планирование",
    items: [
      { href: "/budget", label: "Бюджет", icon: PieChartOutline },
      { href: "/recurring", label: "Платежи", icon: EventRepeatOutlined },
      { href: "/goals", label: "Цели", icon: FlagOutlined },
    ],
  },
  {
    title: "Аккаунт",
    items: [
      { href: "/family", label: "Семья", icon: GroupsOutlined },
      { href: "/profile", label: "Профиль", icon: PersonOutline },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");
