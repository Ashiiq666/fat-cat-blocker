import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BlockerView } from "./components/BlockerView";
import { isBlockerWindow } from "./lib/desktop";

const Root = isBlockerWindow() ? BlockerView : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
