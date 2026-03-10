import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arnav Raj — Full Stack Developer & CPO",
  description:
    "Full Stack Web & App Developer. CPO at Dreamvator. Building digital products that scale and experiences that stick.",
  keywords: ["Arnav Raj", "Full Stack Developer", "React", "Next.js", "CPO", "Dreamvator", "India"],
  authors: [{ name: "Arnav Raj" }],
  openGraph: {
    title: "Arnav Raj — Full Stack Developer & CPO",
    description: "Engineering digital experiences that matter.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
