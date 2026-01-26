import { PrismaClient } from "@prisma/client";

// Single shared Prisma client
export const prisma = new PrismaClient();

// export function getPrismaRLS(userId: string) {
//   return prisma.$extends({
//     query: {
//       $allModels: {
//         async $allOperations({ model, operation, args, query }) {
//           return prisma.$transaction(async (tx) => {
//             await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
//             return query(args);
//           });
//         },
//       },
//     },
//   });
// }
