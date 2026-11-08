import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FocusPage } from "@/components/focus/FocusPage";
import { Providers } from "@/components/Providers";
import "@/styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <FocusPage />
    </Providers>
  </StrictMode>,
);
