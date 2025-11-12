import NextAuth from "next-auth/next";

import { authOptions } from "@/lib/auth/options";

// The runtime configuration matches NextAuth expectations but the type inference
// fails when using the generated Prisma stubs in this environment, so cast here.
const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
