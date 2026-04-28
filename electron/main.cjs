// Electron main process — Fat Cat Blocker
//
// Architecture:
//   • controlWindow  : normal window with the React UI (timer/settings/stats).
//                      Hidden during a break.
//   • overlayWindows : one transparent, frameless, always-on-top window per
//                      display. The cat walks in, sits, walks out. The window
//                      is fully transparent except where the cat draws, but
//                      it absorbs every click + keyboard shortcut so the user
//                      cannot interact with whatever app is behind it.

const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
  Menu,
  dialog,
} = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:5173";

let controlWindow = null;
const overlayWindows = new Map(); // displayId -> BrowserWindow
let blocking = false;

// ----- helpers --------------------------------------------------------------

function loadInto(win, hash = "") {
  if (isDev) {
    win.loadURL(DEV_URL + (hash ? "/#" + hash : ""));
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"), {
      hash: hash || undefined,
    });
  }
}

// ----- windows --------------------------------------------------------------

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    title: "Fat Cat Blocker",
    backgroundColor: "#FFF7EC",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  controlWindow.once("ready-to-show", () => controlWindow.show());

  controlWindow.on("close", (e) => {
    if (blocking) {
      e.preventDefault();
      dialog.showMessageBox(controlWindow, {
        type: "info",
        message: "The cat is on duty.",
        detail: "Finish (or snooze) the current break before quitting.",
        buttons: ["OK"],
      });
    }
  });

  controlWindow.on("closed", () => {
    controlWindow = null;
  });

  loadInto(controlWindow);
}

function createOverlayForDisplay(display) {
  const win = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    roundedCorners: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  // The window must stay above everything — even other apps in macOS native
  // fullscreen Spaces. We re-assert the flags inside ready-to-show because
  // some macOS versions demote a transparent window's level after first paint.
  const assertOnTop = () => {
    if (win.isDestroyed()) return;
    win.setAlwaysOnTop(true, "screen-saver", 1);
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    if (process.platform === "darwin") {
      // simpleFullScreen + kiosk on macOS forces this window to cover all
      // other apps and consume input, even apps in their own native Space.
      try {
        if (!win.isSimpleFullScreen()) win.setSimpleFullScreen(true);
      } catch {
        /* no-op */
      }
      try {
        win.setKiosk(true);
      } catch {
        /* no-op */
      }
    } else {
      try {
        if (!win.isFullScreen()) win.setFullScreen(true);
      } catch {
        /* no-op */
      }
    }
  };

  win.once("ready-to-show", () => {
    win.show();
    assertOnTop();
    if (process.platform === "darwin") app.focus({ steal: true });
    win.focus();
  });

  // If the user Cmd+Tabs to another app, macOS may give that app focus.
  // Snap focus back to our overlay immediately — no 60ms grace period.
  win.on("blur", () => {
    if (!blocking || win.isDestroyed()) return;
    if (process.platform === "darwin") {
      try {
        app.focus({ steal: true });
      } catch {
        /* no-op */
      }
    }
    assertOnTop();
    win.focus();
  });

  // Default behaviour: window receives all mouse events.
  win.setIgnoreMouseEvents(false);

  loadInto(win, "blocker");
  return win;
}

// ----- block / unblock ------------------------------------------------------

function startBlock() {
  if (blocking) return;
  blocking = true;

  // Hide the control window so only the cat is visible.
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.hide();
  }

  // One overlay per display, including primary.
  const displays = screen.getAllDisplays();
  for (const d of displays) {
    if (overlayWindows.has(d.id)) continue;
    overlayWindows.set(d.id, createOverlayForDisplay(d));
  }

  // Block "escape hatch" keyboard shortcuts globally while a break is up.
  // (macOS still owns Cmd+Opt+Esc / Force Quit — that cannot be intercepted.)
  for (const accel of [
    "CommandOrControl+Q",
    "CommandOrControl+W",
    "CommandOrControl+M",
    "CommandOrControl+H",
    "Alt+F4",
    "F11",
  ]) {
    try {
      globalShortcut.register(accel, () => {
        for (const [, w] of overlayWindows) {
          if (!w.isDestroyed()) w.webContents.send("blocker:nudge");
        }
      });
    } catch {
      /* shortcut may already be in use — ignore */
    }
  }

  if (process.platform === "darwin" && app.dock) {
    try {
      app.dock.hide();
    } catch {
      /* no-op */
    }
  }
}

function endBlock() {
  if (!blocking) return;
  blocking = false;

  globalShortcut.unregisterAll();

  for (const [, win] of overlayWindows) {
    try {
      if (win.isDestroyed()) continue;
      win.setClosable(true);
      try {
        if (win.isKiosk()) win.setKiosk(false);
      } catch {
        /* no-op */
      }
      if (process.platform === "darwin") {
        try {
          if (win.isSimpleFullScreen()) win.setSimpleFullScreen(false);
        } catch {
          /* no-op */
        }
      }
      win.destroy();
    } catch {
      /* no-op */
    }
  }
  overlayWindows.clear();

  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.show();
    controlWindow.focus();
  }

  if (process.platform === "darwin" && app.dock) {
    try {
      app.dock.show();
    } catch {
      /* no-op */
    }
  }
}

function broadcastToOverlays(channel, payload) {
  for (const [, win] of overlayWindows) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function forwardToControl(channel, payload) {
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send(channel, payload);
  }
}

// ----- IPC ------------------------------------------------------------------

ipcMain.handle("desktop:available", () => true);
ipcMain.handle("desktop:startBlock", () => {
  startBlock();
  return true;
});
ipcMain.handle("desktop:endBlock", () => {
  endBlock();
  return true;
});
ipcMain.handle("desktop:tick", (_e, payload) => {
  broadcastToOverlays("blocker:state", payload);
  return true;
});

// Overlay -> control forwarding
ipcMain.handle("overlay:done", () => {
  forwardToControl("control:done");
  return true;
});
ipcMain.handle("overlay:snooze", () => {
  forwardToControl("control:snooze");
  return true;
});
ipcMain.handle("overlay:pet", () => {
  forwardToControl("control:pet");
  return true;
});
ipcMain.handle("overlay:feed", () => {
  forwardToControl("control:feed");
  return true;
});

// ----- lifecycle ------------------------------------------------------------

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createControlWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (e) => {
  if (blocking) e.preventDefault();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
