import { boot } from './game.js';

const app = boot();

// Keep the branded native launch screen up until the first screen has actually
// painted. Without this the WebView shows a black frame while it boots.
const splash = window.Capacitor?.Plugins?.SplashScreen;
if (splash?.hide) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        Promise.resolve(splash.hide({ fadeOutDuration: 220 })).catch(() => {});
      }, 450);
    });
  });
}

// Offline support. Registered after load so development is never blocked.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      /* offline cache is optional */
    });
  });
}

export default app;
