import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("Failed to mount application (reason=root_element_missing)");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
