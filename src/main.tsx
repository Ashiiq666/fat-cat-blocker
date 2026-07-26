import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BlockerView } from "./components/BlockerView";
import { isBlockerWindow } from "./lib/desktop";

// Entry file — the react-refresh rule only applies to modules that export
// components for HMR; this one just bootstraps the app.
// eslint-disable-next-line react-refresh/only-export-components
const Root = isBlockerWindow() ? BlockerView : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
