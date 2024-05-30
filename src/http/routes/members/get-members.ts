import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { rolesSchema } from '@/auth/models/roles'

export async function getMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .get(
      '/organization/:slug/members',
      {
        schema: {
          tags: ['Members'],
          summary: 'Get members',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              members: z.array(
                z.object({
                  id: z.string().uuid(),
                  userId: z.string().uuid(),
                  role: rolesSchema,
                  name: z.string().nullable(),
                  email: z.string().email(),
                  avatarUrl: z.string().url().nullable(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getMemberShip(slug)

        const { cannot } = getUserPermission(userId, membership.role)
        if (cannot('get', 'User')) {
          throw new UnauthorizedError(
            `You're not allowed to see organization members`
          )
        }

        const members = await prisma.member.findMany({
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            role: 'asc',
          },
        })

        const formattedMembers = members.map(
          ({ user: { id: userId, ...user }, ...members }) => {
            return {
              ...user,
              ...members,
              userId,
            }
          }
        )

        return reply.status(200).send({ members: formattedMembers })
      }
    )
}
