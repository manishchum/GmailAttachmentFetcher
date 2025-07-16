import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
export { dynamic } from "@/lib/dynamic";

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
