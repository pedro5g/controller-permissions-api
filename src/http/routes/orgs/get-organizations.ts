import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { prisma } from '@/http/lib/prisma'
import { rolesSchema } from '@/auth/models/roles'

export async function getOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .get(
      '/get/organizations',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get user organizations',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().url().nullable(),
                  role: rolesSchema,
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            members: {
              where: { userId },
              select: { role: true },
            },
          },
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        })

        const formatOrganizationResponse = organizations.map(
          ({ members, ...rest }) => {
            return { ...rest, role: members[0].role }
          }
        )

        return reply
          .status(200)
          .send({ organizations: formatOrganizationResponse })
      }
    )
}
