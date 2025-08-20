import type { Metadata } from "next";
import { EB_Garamond, Space_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { HomepageProvider } from "@/contexts/HomepageContext";
import { AnnouncementBarProvider } from "@/contexts/AnnouncementBarContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { cssOptimizer } from "@/lib/theme-cache";
import { ServerThemeProvider } from "@/components/ServerThemeProvider";
import { ServerNavigationProvider } from "@/components/ServerNavigationProvider";
import { ThemeHydrator } from "@/components/ThemeHydrator";
import AnnouncementBarWrapper from "@/components/AnnouncementBarWrapper";
import CartRecoveryNotification from "@/components/CartRecoveryNotification";

const ebGaramond = EB_Garamond({
  weight: ["400", "700"],
  variable: "--font-serif",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Porch Records - Independent Record Label & Store",
  description: "Curated vinyl spanning jazz, funk, soul, hip hop, international groove music and beyond. Live shows, Summertown Studio, and more.",
  keywords: ["vinyl", "records", "jazz", "funk", "soul", "hip hop", "record store", "Adelaide", "music", "independent", "groove"],
  authors: [{ name: "Porch Records" }],
  creator: "Porch Records",
  publisher: "Porch Records",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://porchrecords.com.au"),
  alternates: {
    canonical: "https://porchrecords.com.au",
  },
  openGraph: {
    title: "Porch Records",
    description: "Independent record label and store specializing in jazz, funk, soul, and international groove music.",
    url: "https://porchrecords.com.au",
    siteName: "Porch Records",
    locale: "en_AU",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Porch Records",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Porch Records",
    description: "Independent record label and store specializing in jazz, funk, soul, and international groove music.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ServerThemeProvider />
        <ServerNavigationProvider />
      </head>
      <body
        className={`${ebGaramond.variable} ${spaceMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider>
            <HomepageProvider>
              <AnnouncementBarProvider>
                <CartProvider>
                  <ThemeHydrator>
                    <PageTransition>
                      <AnnouncementBarWrapper />
                      <CartRecoveryNotification />
                      <ThemeInitializer />
                      <div style={{ paddingTop: 'calc(var(--announcement-bar-height, 0px) + var(--nav-height, 64px))' }}>
                        {children}
                      </div>
                    </PageTransition>
                  </ThemeHydrator>
                </CartProvider>
              </AnnouncementBarProvider>
            </HomepageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Flush any pending CSS updates on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cssOptimizer.flush();
  });
}
