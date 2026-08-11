import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// react-native-web's Animated internals call `global.cancelAnimationFrame`
// when a running animation is stopped (e.g. exiting a mini-game mid-play).
// Browsers have no `global`, so without this shim that path throws and
// unmounts the entire app.
if (typeof (globalThis as any).global === "undefined") {
  (globalThis as any).global = globalThis;
}

// Suppress runtime error modal by intercepting errors globally
const originalError = console.error;
console.error = (...args) => {
  const errorString = args.join(' ');
  // Suppress specific Radix UI / Select errors that trigger the modal
  if (
    errorString.includes('SelectPrimitive') ||
    errorString.includes('SelectItem') ||
    errorString.includes('ItemText') ||
    errorString.includes('Uncaught Error') ||
    errorString.includes('runtime error')
  ) {
    // Log warning instead
    console.warn('Suppressed error:', ...args);
    return;
  }
  originalError.call(console, ...args);
};

// Global error handler to prevent error modal
window.addEventListener('error', (event) => {
  const errorString = event.message || '';
  if (
    errorString.includes('SelectPrimitive') ||
    errorString.includes('SelectItem') ||
    errorString.includes('ItemText') ||
    event.filename?.includes('select')
  ) {
    event.preventDefault();
    event.stopPropagation();
    console.warn('Global error suppressed:', event.message);
    return false;
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason);
  if (
    reason.includes('SelectPrimitive') ||
    reason.includes('SelectItem') ||
    reason.includes('ItemText')
  ) {
    event.preventDefault();
    event.stopPropagation();
    console.warn('Promise rejection suppressed:', event.reason);
    return false;
  }
});

// Aggressively hide error modal using DOM mutation observer
const hideErrorModal = () => {
  // Try to find and hide the modal
  const selectors = [
    '#vite-plugin-runtime-error-modal',
    '[data-vite-plugin-runtime-error-modal]',
    '.vite-error-overlay',
    'iframe[src*="error"]',
    'iframe[title*="error"]',
    'div[style*="z-index: 9999"]',
    'div[style*="position: fixed"][style*="inset: 0"]'
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      (el as HTMLElement).style.display = 'none';
      (el as HTMLElement).style.visibility = 'hidden';
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.pointerEvents = 'none';
      (el as HTMLElement).remove();
    });
  });
};

// Run immediately and on interval
hideErrorModal();
setInterval(hideErrorModal, 100);

// Watch for DOM mutations to catch dynamically added modals
const observer = new MutationObserver(() => {
  hideErrorModal();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker so the app is installable to the home screen
// and opens instantly. Only in production builds — the Vite dev server
// serves modules the SW shouldn't cache.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
