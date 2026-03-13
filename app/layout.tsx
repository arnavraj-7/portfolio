import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        {/* Preload primary fonts so they're ready before first paint */}
        <link rel="preload" href="/ClashDisplay_Complete/Fonts/WEB/fonts/ClashDisplay-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Devicons loaded async — media="print" prevents render-blocking, script swaps to "all" after load */}
        <link rel="stylesheet" type="text/css" id="devicons-css" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" media="print" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var l=document.getElementById('devicons-css');if(l)l.addEventListener('load',function(){l.media='all'})})()` }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
