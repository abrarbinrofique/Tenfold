"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 15_000,
            retry: 1,
          },
        },
      }),
  );

  // Respect localStorage theme
  useEffect(() => {
    const t = localStorage.getItem("tenfold-theme");
    const root = document.documentElement;
    if (t === "light") root.classList.remove("dark");
    else root.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={120}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg)",
              color: "var(--fg)",
              border: "1px solid var(--hair)",
              borderRadius: "6px",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
