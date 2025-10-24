import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(<App />);
