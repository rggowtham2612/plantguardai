// Client-side diagnostics: logs which /api endpoint returns 402 or a
// "Payment Required" body, plus the call stack (shows the UI component that triggered it).
let installed = false;

export function logPaymentRequiredUi(component: string, message: unknown) {
  const text = String(message ?? "");
  if (/payment required|402|credits/i.test(text)) {
    console.warn(`[PaymentRequired][UI] rendered by <${component}>:`, text);
  }
}

export function installPaymentRequiredLogging() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await original(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/api/")) return res;
    let bodyHint = "";
    if (!res.ok) {
      bodyHint = await res.clone().text().catch(() => "");
    }
    if (res.status === 402 || /payment required/i.test(bodyHint)) {
      console.warn("[PaymentRequired][API]", {
        endpoint: url,
        method: init?.method ?? "GET",
        status: res.status,
        body: bodyHint.slice(0, 500),
        page: window.location.pathname,
      });
      console.trace("[PaymentRequired] triggered from");
    }
    return res;
  };
}
