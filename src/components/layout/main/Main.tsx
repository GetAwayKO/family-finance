import { ReactNode } from "react";
import "./_main.scss";
interface MainType {
  children: ReactNode;
}

export default function Main({ children }: MainType) {
  return <main>{children}</main>;
}
