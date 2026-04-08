import type { Metadata } from "next";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";

export const metadata: Metadata = {
  title: "Covey Task Manager",
  description: "Manage tasks using the Covey Time Management Matrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavWrapper />
        {children}
      </body>
    </html>
  );
}
