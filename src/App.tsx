// src/App.tsx
import React, { useEffect } from "react";
import { Layout } from "./components/Layout";

export default function App() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only trust messages from the same origin (WebContainer)
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "serverReady" && typeof event.data.url === "string") {
        const url = event.data.url;

        // Store globally (for legacy Preview.tsx fallback)
        (window as any).webContainerUrl = url;

        // Dispatch custom event for modern Preview.tsx
        window.dispatchEvent(new CustomEvent("serverReady", { detail: { url } }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return <Layout />;
}