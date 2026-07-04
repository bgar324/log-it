import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "./components/ui/toaster";
import { PwaClient } from "./components/pwa-client";
import "katex/dist/katex.min.css";
import "./globals.css";

const themeInitScript = `(() => {
  try {
    const storedTheme = window.localStorage.getItem("logit-theme");
    const theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.colorScheme = "light";
  }
})();`;

export const metadata: Metadata = {
  applicationName: "logit",
  title: "logit",
  description: "A simple workout tracker.",
  appleWebApp: {
    capable: true,
    title: "logit",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icon-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/icon-light.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-theme="light"
      data-color-scheme="light"
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <Toaster />
        <PwaClient />
      </body>
    </html>
  );
}
