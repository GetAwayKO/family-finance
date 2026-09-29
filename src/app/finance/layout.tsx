export default function FinanceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="finance__layout">{children}</div>;
}
