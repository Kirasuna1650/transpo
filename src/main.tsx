import { createRoot } from "react-dom/client";
import "./styles/index.css";

function showStartupError(error: unknown) {
  const root = document.getElementById("root");
  const message = error instanceof Error ? error.stack || error.message : String(error);
  if (!root) return;

  root.innerHTML = `
    <div style="min-height:100%;display:flex;align-items:center;justify-content:center;background:#f7f7f7;color:#202124;font-family:Inter,Arial,sans-serif;padding:24px;">
      <div style="width:min(720px,100%);border:1px solid #d0d5dd;border-radius:16px;background:#fff;padding:20px;box-shadow:0 18px 50px rgba(16,24,40,.12);">
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">Transpo could not start</div>
        <div style="font-size:13px;color:#667085;margin-bottom:14px;">Open the browser console for the full trace, or send this message back here.</div>
        <pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.45;margin:0;background:#f2f4f7;border-radius:10px;padding:14px;max-height:55vh;overflow:auto;">${message.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char] || char)}</pre>
      </div>
    </div>
  `;
}

window.addEventListener("error", (event) => showStartupError(event.error || event.message));
window.addEventListener("unhandledrejection", (event) => showStartupError(event.reason));

import("./app/App.tsx")
  .then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch(showStartupError);
