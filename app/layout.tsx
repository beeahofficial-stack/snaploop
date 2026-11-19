import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SnapLoop",
  description: "A mini social network — share moments, connect with people.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              color: "#2C3318",
              border: "1px solid #E6E1D4",
              borderRadius: "14px",
              fontSize: "14px",
              boxShadow: "0 10px 30px rgba(70, 80, 40, 0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
