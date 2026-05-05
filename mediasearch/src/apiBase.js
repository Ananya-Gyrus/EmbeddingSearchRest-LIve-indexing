/**
 * Returns the API base URL.
 * - When accessed via localhost/127.0.0.1 (Electron or local dev), use the
 *   explicit host:port from backendConfig so the app still works directly.
 * - When accessed from a remote host (e.g. via a pinggy / ngrok tunnel),
 *   return an empty string so all fetch() calls use relative URLs and the
 *   CRA dev-server proxy forwards them to Flask on port 5800.
 */
export function getApiBase(backendConfig) {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocal) return '';
  return `http://${backendConfig.host}:${backendConfig.port}`;
}
