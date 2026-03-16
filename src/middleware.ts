import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"])

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  const pathname = url.pathname

  const isAdminRoute = pathname.startsWith("/admin")
  const isSuperAdminRoute = pathname.startsWith("/superadmin")

  if (isAdminRoute || isSuperAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isSuperAdminRoute && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    if (isAdminRoute && token.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin", request.url))
    }
  }

  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (token) {
      if (token.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/superadmin", request.url))
      }
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000"
  let subdomain: string | null = null

  if (hostname.includes(appDomain)) {
    const possibleSubdomain = hostname.replace(`.${appDomain}`, "").split(":")[0]
    if (possibleSubdomain !== hostname.split(":")[0] && possibleSubdomain.length > 0) {
      subdomain = possibleSubdomain
    }
  }

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next()
  }

  if (url.pathname.startsWith("/store/")) return NextResponse.next()
  if (url.pathname.startsWith("/api/")) return NextResponse.next()
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  url.pathname = `/store/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
