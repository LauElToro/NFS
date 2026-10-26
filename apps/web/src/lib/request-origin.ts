export function clientIp(req: Request) {
  return req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
}

export function publicOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return new URL(req.url).origin;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
