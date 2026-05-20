import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipeline Builder",
  description: "Standalone Vision AI pipeline editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 500,
              boxShadow: "var(--shadow-dropdown)",
            },
            success: {
              iconTheme: { primary: "var(--success)", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "var(--error)", secondary: "white" },
            },
          }}
        />
      </body>
    </html>
  );
}
