import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/fullscreen.css";
import "react-toastify/dist/ReactToastify.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import ElevenLabsProviderWrapper from "@/providers/ElevenLabsProvider";
import PostHogProvider from "@/providers/PostHogProvider";
import PrivateRoute from "@/components/auth/PrivateRoute";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import ResultModalProvider from "@/components/providers/ResultModalProvider";
import FeedbackModalProvider from "@/components/providers/FeedbackModalProvider";
import { ToastContainer } from "react-toastify";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Upskillr",
  description: "Training Using AI",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    "apple-touch-icon": "/icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Upskillr" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <link rel="icon" type="image/png" href="/icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
                  <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                  />
                </FeedbackModalProvider>
              </ResultModalProvider>
            </ElevenLabsProviderWrapper>
          </ReduxProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
