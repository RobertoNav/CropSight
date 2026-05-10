import "../styles/globals.css";

import "@tabler/icons-webfont/dist/tabler-icons.min.css";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}