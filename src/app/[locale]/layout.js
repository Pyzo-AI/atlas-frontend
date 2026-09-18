import { Geist, Geist_Mono, Lato, Montserrat } from "next/font/google";
import "./globals.css";
import "../../styles/fullscreen.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import ElevenLabsProviderWrapper from "@/providers/ElevenLabsProvider";
import PostHogProvider from "@/providers/PostHogProvider";
import PrivateRoute from "@/components/auth/PrivateRoute";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import ResultModalProvider from "@/components/providers/ResultModalProvider";
import FeedbackModalProvider from "@/components/providers/FeedbackModalProvider";
import { Toaster } from "react-hot-toast";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import TranslationProvider from "@/providers/TranslationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lato = Lato({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
});

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata = {
  title: "Atlas",
  description: "Training Using AI",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
    "apple-touch-icon": "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Without this, mobile keyboards on Chrome/Android only shift the *visual*
  // viewport (visualViewport.height) while the layout viewport (and every
  // 100vh/100dvh/var(--app-height) container anchored to it) stays the same
  // size — leaving a gap of stale, now-offscreen layout below focused inputs
  // whenever the keyboard opens. "resizes-content" makes the layout viewport
  // itself shrink with the keyboard, so 100dvh/--app-height-based layouts
  // (PortraitLectureView, ChatUI's input footer, etc.) actually resize instead
  // of leaving blank space behind.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children, params }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "en";

  return (
    <html lang={locale}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Atlas" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} ${montserrat.variable} antialiased font-lato`}>
        <TranslationProvider locale={locale}>
          <PostHogProvider>
            <ReduxProvider>
            <ElevenLabsProviderWrapper>
              <ResultModalProvider>
                <FeedbackModalProvider>
                  <PrivateRoute>
                    <LayoutWrapper>
                      <ResponsiveContainer>{children}</ResponsiveContainer>
                    </LayoutWrapper>
                  </PrivateRoute>
                  <Toaster
                    position="bottom-right"
                    reverseOrder={false}
                    containerStyle={{
                      bottom: 40,
                      right: 40,
                    }}
                  />
                </FeedbackModalProvider>
              </ResultModalProvider>
            </ElevenLabsProviderWrapper>
          </ReduxProvider>
        </PostHogProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
