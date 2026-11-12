import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "@/components/popup/Popup";
import { Providers } from "@/components/Providers";
import "@/styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <Popup />
    </Providers>
  </StrictMode>,
);
