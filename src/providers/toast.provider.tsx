"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme.provider";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme={theme === "system" ? "system" : theme}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            borderRadius: "0.5rem",
          },
        }}
      />
    </>
  );
} 