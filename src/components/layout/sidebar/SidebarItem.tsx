import Link from "next/link";
import { ReactNode } from "react";

interface SidebarProps {
  text?: string;
  children?: ReactNode;
}
export default function SidebarItem({ children, text }: SidebarProps) {
  return (
    <li>
      <div>
        {text || children}
        <Link href={"/profile"} />
      </div>
    </li>
  );
}
