import { boot } from './game.js';

const app = boot();

// Offline support. Registered after load so development is never blocked.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      /* offline cache is optional */
    });
  });
}

export default app;
