import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Options } from "@/components/options/Options";
import { Providers } from "@/components/Providers";
import "@/styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <Options />
    </Providers>
  </StrictMode>,
);
