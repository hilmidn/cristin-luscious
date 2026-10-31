import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const LOGIN_PATH = "/admin/login";

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const isLoggedIn = Boolean(req.nextauth.token);

    if (isLoggedIn && pathname === LOGIN_PATH) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (!isLoggedIn && pathname !== LOGIN_PATH) {
      const loginUrl = new URL(LOGIN_PATH, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    // All decisions are handled inside the function above.
    // `pages.signIn` is intentionally not set here: NextAuth treats that path
    // as public and would skip this proxy entirely, so a logged-in user could
    // still open /admin/login.
    callbacks: { authorized: () => true },
  },
);

export const config = {
  matcher: ["/admin/:path*"],
};
