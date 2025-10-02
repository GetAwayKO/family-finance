import { ReactNode } from "react";

interface MainType {
  children: ReactNode;
}

export default function Main({ children }: MainType) {
  return <main>{children}</main>;
}
