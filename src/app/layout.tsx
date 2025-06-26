import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/navbar";
import { inter } from "../utils/fonts";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Arnav Raj",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-black-100 text-white min-h-screen items-center ${inter.className}`}>
        <Navbar/>
        {children}
      </body>
    </html>
  );
}
