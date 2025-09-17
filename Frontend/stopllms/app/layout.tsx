import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/sections/navbar/default";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stop LLMs",
  description: "Stop LLMs is a mindful browser companion that intercepts trips to AI chatbots, uses machine learning to vet your reason for visiting, and keeps you in control without banning the tools outright.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark text-foreground bg-background`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
