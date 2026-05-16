import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ensureTenantId } from "@/lib/auth/tenant";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Farm Login",

      credentials: {
        email: {
          label: "Email",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials: any) {
        if (!credentials?.email) {
          return null;
        }

        const tenantId = ensureTenantId({
          email: credentials.email,
        });

        return {
          id: credentials.email,
          email: credentials.email,
          tenantId,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt" as const,
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.tenantId = user.tenantId;
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.tenantId = token.tenantId;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
