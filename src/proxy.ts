import { NextResponse, type NextRequest } from "next/server";

// Which half of the app this server instance serves, set by the npm scripts:
//   web       -> storefront (app/(web)), port 3000
//   dashboard -> admin (app/dashboard + app/login), port 3001
// Anything else (e.g. a plain `next dev`) behaves like the storefront.
const target = process.env.APP_TARGET;

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (target === "dashboard") {
    if (pathname === "/login") return NextResponse.next();

    // The admin lives at the root of its port (/, /products, /settings...).
    // Old /dashboard/... links redirect to the short address.
    if (isUnder(pathname, "/dashboard")) {
      const clean = pathname.slice("/dashboard".length) || "/";
      return NextResponse.redirect(new URL(clean, request.url));
    }

    // Serve the short address from the files in app/dashboard.
    const internal = pathname === "/" ? "/dashboard" : `/dashboard${pathname}`;
    return NextResponse.rewrite(new URL(internal, request.url));
  }

  // Storefront: the admin pages don't exist here.
  if (isUnder(pathname, "/dashboard") || pathname === "/login") {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files (anything with a file extension).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
