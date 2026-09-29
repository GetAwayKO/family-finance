import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.scss";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/shared/auth/AuthProvider";
import ThemeRegistry from "@/theme/ThemeRegistry";

// Manrope с кириллицей: у Geist был подключён только латинский набор,
// и русский текст отображался запасным шрифтом.
const appFont = Manrope({
  variable: "--font-app",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Cash Flow",
  description: "Учёт личных и семейных финансов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${appFont.variable} antialiased`}>
        <ThemeRegistry>
          <AuthProvider>
            <MainLayout>{children}</MainLayout>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
