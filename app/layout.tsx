
import type { Metadata } from "next";
import "./globals.css";

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
