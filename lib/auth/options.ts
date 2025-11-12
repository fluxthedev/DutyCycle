import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

import type { JWT } from "next-auth/jwt";

import { prisma } from "@/lib/prisma";
import { prismaAdapter } from "@/lib/auth/prisma-adapter";
import { derivePermissions } from "@/lib/auth/roles";
import type { AppUserRole } from "@/lib/auth/roles";
const allowedCredentialRoles: AppUserRole[] = ["ADMIN", "MANAGER"];
const defaultRole: AppUserRole = "CLIENT";

const emailFrom = process.env.EMAIL_FROM ?? "no-reply@dutycycle.local";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("NEXTAUTH_SECRET is not set. Sessions may be insecure in production.");
}

function buildEmailTransport() {
  if (process.env.EMAIL_SERVER) {
    return nodemailer.createTransport(process.env.EMAIL_SERVER);
  }

  if (process.env.EMAIL_SERVER_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      secure: false,
      auth:
        process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
          ? {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            }
          : undefined,
    });
  }

  // Fallback to JSON transport so verification links are logged during development.
  return nodemailer.createTransport({ jsonTransport: true });
}

export const authOptions = {
  adapter: prismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    EmailProvider({
      from: emailFrom,
      maxAge: 60 * 60, // 1 hour
      sendVerificationRequest: async ({ identifier, url }) => {
        const transport = buildEmailTransport();

        await transport.sendMail({
          to: identifier,
          from: emailFrom,
          subject: "Your DutyCycle sign-in link",
          text: `Sign in to DutyCycle using the link below.\n\n${url}\n\nThis link expires in 1 hour.`,
          html: `<p>Sign in to DutyCycle using the link below.</p><p><a href="${url}">Sign in</a></p><p>This link expires in 1 hour.</p>`,
        });

        if ((transport as any).options?.jsonTransport) {
          console.info("Preview sign-in link for %s: %s", identifier, url);
        }
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        if (!allowedCredentialRoles.includes(user.role as AppUserRole)) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isValid) {
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id?: unknown; role?: unknown } | null }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role as AppUserRole;
      }

      return token;
    },
    async session({
      session,
      token
    }: {
      session: {
        user?: {
          id?: unknown;
          role?: unknown;
          permissions?: unknown;
          email?: string | null;
          name?: string | null;
        } | null;
      } & Record<string, unknown>;
      token: JWT;
    }) {
      if (session.user) {
        const derivedId =
          typeof token.id === "number"
            ? token.id
            : token.id !== undefined
              ? Number(token.id)
              : undefined;

        if (derivedId !== undefined && !Number.isNaN(derivedId)) {
          session.user.id = derivedId;
        }

        const role =
          (token.role as AppUserRole | undefined) ??
          (session.user.role as AppUserRole | undefined) ??
          defaultRole;
        session.user.role = role;
        session.user.permissions = derivePermissions(role);
      }

      return session;
    },
  },
};
