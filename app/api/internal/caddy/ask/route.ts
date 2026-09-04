import { NextRequest, NextResponse } from "next/server";
import { resolveTenantByHostname } from "@/lib/tenant-context";
import { isPlatformHostname } from "@/lib/domain-config";

const HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim().toLowerCase().replace(/\.$/, "");
  if (!domain || !HOSTNAME_RE.test(domain)) {
    return new NextResponse(null, { status: 400 });
  }

  // onlycars.nanoapps.ar pertenece al Proxy Host exacto de plataforma,
  // nunca debe ser reclamado como tenant por el wildcard/router compartido.
  if (isPlatformHostname(domain)) {
    return new NextResponse(null, { status: 404 });
  }

  const result = await resolveTenantByHostname(domain);
  return new NextResponse(null, { status: result.success ? 204 : 404 });
}
