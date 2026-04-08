import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        // Implement real database check later
        console.log("Authorizing...", credentials);
        return { id: "1", name: "Admin", email: credentials.email as string }
      },
    }),
  ],
})
