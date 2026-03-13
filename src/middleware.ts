import { NextRequest, NextResponse } from "next/server"

const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"])

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  // Extrair o domínio base da env ou usar localhost como fallback
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000"

  // Extrair subdomínio
  // Em dev: pizzariadojose.localhost:3000
  // Em prod: pizzariadojose.pedefacil.com.br
  let subdomain: string | null = null

  if (hostname.includes(appDomain)) {
    const possibleSubdomain = hostname.replace(`.${appDomain}`, "").split(":")[0]
    if (possibleSubdomain !== hostname.split(":")[0] && possibleSubdomain.length > 0) {
      subdomain = possibleSubdomain
    }
  }

  // Se não há subdomínio ou é reservado, deixa seguir normalmente
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next()
  }

  // Se já está na rota /store, não reescrever novamente
  if (url.pathname.startsWith("/store/")) {
    return NextResponse.next()
  }

  // Rotas de API não devem ser reescritas
  if (url.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Arquivos estáticos e _next não devem ser reescritos
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Reescreve a URL para /store/[slug]/...
  url.pathname = `/store/${subdomain}${url.pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
