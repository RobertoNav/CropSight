import '../styles/globals.css'
import { AppShell } from "@/components/layout/AppShell";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}