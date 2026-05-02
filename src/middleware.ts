import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tactics/:path*",
    "/games/:path*",
    "/openings/:path*",
    "/endgames/:path*",
    "/calculation/:path*",
    "/middlegame/:path*",
    "/progress/:path*",
    "/coach/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/play/:path*",
    "/custom-mode/:path*",
    "/admin/:path*",
  ],
};
