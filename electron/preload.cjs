// Safe IPC bridge between main process and renderer windows.
// Exposed surface: window.fatcat

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fatcat", {
  isDesktop: true,

  // Control-side
  available: () => ipcRenderer.invoke("desktop:available"),
  startBlock: () => ipcRenderer.invoke("desktop:startBlock"),
  endBlock: () => ipcRenderer.invoke("desktop:endBlock"),
  tick: (payload) => ipcRenderer.invoke("desktop:tick", payload),

  // Overlay-side actions (sent from overlay windows back to control window)
  requestDone: () => ipcRenderer.invoke("overlay:done"),
  requestSnooze: () => ipcRenderer.invoke("overlay:snooze"),
  requestPet: () => ipcRenderer.invoke("overlay:pet"),
  requestFeed: () => ipcRenderer.invoke("overlay:feed"),

  // Subscriptions
  onBlockerState: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("blocker:state", handler);
    return () => ipcRenderer.removeListener("blocker:state", handler);
  },
  onNudge: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("blocker:nudge", handler);
    return () => ipcRenderer.removeListener("blocker:nudge", handler);
  },
  onControlMessage: (cb) => {
    const channels = ["control:done", "control:snooze", "control:pet", "control:feed"];
    const make = (name) => (_e) => cb(name);
    const handlers = channels.map((c) => {
      const h = make(c.replace("control:", ""));
      ipcRenderer.on(c, h);
      return [c, h];
    });
    return () => handlers.forEach(([c, h]) => ipcRenderer.removeListener(c, h));
  },
});
