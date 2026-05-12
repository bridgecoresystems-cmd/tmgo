/// <reference types="vite/client" />

declare module 'leaflet';

interface Window {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
}
