import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/serviceWorker";

// Registra Service Worker para cache otimizado
if (import.meta.env.PROD) {
  registerServiceWorker().then((status) => {
    if (status.isRegistered) {
      console.log('🚀 Service Worker registrado - Cache otimizado ativo!');
    }
  }).catch((error) => {
    console.warn('⚠️ Falha ao registrar Service Worker:', error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
// Force redeploy sáb 27 set 2025 23:00:40 -03
