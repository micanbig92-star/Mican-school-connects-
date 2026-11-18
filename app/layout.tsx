
import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";
import "./button-enhancements.css";
import "./dashboard-enhancements.css";
import "./live-learning-enhancements.css";

export const metadata: Metadata = {
  title: "MICAN SCHOOLS CONNECT",
  description:
    "One Network. Many Schools. One Connected Future. A global education platform by MICAN Technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
