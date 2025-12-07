import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./providers/auth-provider";
import { Navigation } from "./components/navigation";

export const metadata: Metadata = {
  title: "Study Buddy",
  description: "Personal AI Study Companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}


