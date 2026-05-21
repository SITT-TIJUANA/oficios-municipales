import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Sistema de Oficios Municipales",
  description: "Sistema de control y seguimiento de oficios e instrucciones del H. Ayuntamiento Municipal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-white !border-guinda-200 !shadow-lg",
              title: "!text-gray-900",
              description: "!text-gray-600",
              success: "!border-green-200",
              error: "!border-red-200",
            },
          }}
        />
      </body>
    </html>
  );
}
