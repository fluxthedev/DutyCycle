import type { Adapter } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";

export function prismaAdapter(prisma: PrismaClient): Adapter {
  return {
    createUser: async (data: Parameters<NonNullable<Adapter["createUser"]>>[0]) => {
      return (await prisma.user.create({
        data: data as any,
      })) as any;
    },
    getUser: async (id: Parameters<NonNullable<Adapter["getUser"]>>[0]) => {
      if (!id) return null;
      return prisma.user.findUnique({
        where: { id: Number(id) },
      }) as any;
    },
    getUserByEmail: async (email: Parameters<NonNullable<Adapter["getUserByEmail"]>>[0]) => {
      if (!email) return null;
      return prisma.user.findUnique({
        where: { email },
      }) as any;
    },
    getUserByAccount: async ({ provider, providerAccountId }: Parameters<NonNullable<Adapter["getUserByAccount"]>>[0]) => {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });

      if (!account) return null;
      return account.user as any;
    },
    updateUser: async (data: Parameters<NonNullable<Adapter["updateUser"]>>[0]) => {
      if (!data.id) {
        throw new Error("User id is required to update user");
      }

      const { id, ...rest } = data;
      return prisma.user.update({
        where: { id: Number(id) },
        data: rest as any,
      }) as any;
    },
    deleteUser: async (id: Parameters<NonNullable<Adapter["deleteUser"]>>[0]) => {
      if (!id) return null;
      return prisma.user.delete({
        where: { id: Number(id) },
      }) as any;
    },
    linkAccount: async (data: Parameters<NonNullable<Adapter["linkAccount"]>>[0]) =>
      (await prisma.account.create({
        data: data as any,
      })) as any,
    unlinkAccount: async ({ provider, providerAccountId }: Parameters<NonNullable<Adapter["unlinkAccount"]>>[0]) => {
      try {
        await prisma.account.delete({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId,
            },
          },
        });
      } catch (error) {
        return undefined;
      }
    },
    createSession: async (data: Parameters<NonNullable<Adapter["createSession"]>>[0]) =>
      (await prisma.session.create({
        data: data as any,
      })) as any,
    getSessionAndUser: async (
      sessionToken: Parameters<NonNullable<Adapter["getSessionAndUser"]>>[0]
    ) => {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!session) return null;
      const { user, ...sessionData } = session;
      return { session: sessionData as any, user: user as any };
    },
    updateSession: async (data: Parameters<NonNullable<Adapter["updateSession"]>>[0]) => {
      const { sessionToken } = data;
      try {
        return (await prisma.session.update({
          where: { sessionToken },
          data: data as any,
        })) as any;
      } catch (error) {
        return null;
      }
    },
    deleteSession: async (sessionToken: Parameters<NonNullable<Adapter["deleteSession"]>>[0]) => {
      try {
        return (await prisma.session.delete({
          where: { sessionToken },
        })) as any;
      } catch (error) {
        return null;
      }
    },
    createVerificationToken: (
      data: Parameters<NonNullable<Adapter["createVerificationToken"]>>[0]
    ) => {
      return prisma.verificationToken.create({
        data: data as any,
      }) as any;
    },
    useVerificationToken: async ({
      identifier,
      token
    }: Parameters<NonNullable<Adapter["useVerificationToken"]>>[0]) => {
      try {
        return (await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        })) as any;
      } catch (error) {
        return null;
      }
    },
  };
}

export default prismaAdapter;
