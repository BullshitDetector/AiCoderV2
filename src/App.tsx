// src/App.tsx
import React, { useEffect } from "react";
import { Layout } from "./components/Layout";

export default function App() {
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === "serverReady" && e.data.url) {
        window.postMessage(e.data, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return <Layout />;
}