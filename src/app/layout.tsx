import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caprock Tubular Services",
  description: "Pipe yard inventory and work order operations.",
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
