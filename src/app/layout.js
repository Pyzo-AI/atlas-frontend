import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import ElevenLabsProviderWrapper from "@/providers/ElevenLabsProvider";
import PostHogProvider from "@/providers/PostHogProvider";
import PrivateRoute from "@/components/auth/PrivateRoute";
import Header from "@/components/layout/Header";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TrainBoost",
  description: "Training Using AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <ReduxProvider>
            <ElevenLabsProviderWrapper>
              <PrivateRoute>
                <div className="min-h-screen pt-[52px]">
                  {children}
                </div>
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
            </ElevenLabsProviderWrapper>
          </ReduxProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
