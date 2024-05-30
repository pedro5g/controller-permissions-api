import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { rolesSchema } from '@/auth/models/roles'

export async function updateMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .patch(
      'organization/:slug/member/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Update member',
          security: [{ BearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            memberId: z.string().uuid(),
          }),
          body: z.object({
            role: rolesSchema,
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, memberId } = request.params
        const { role } = request.body
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getMemberShip(slug)

        const { cannot } = getUserPermission(userId, membership.role)

        if (cannot('update', 'User')) {
          throw new UnauthorizedError(
            `You're not allowed to update this member`
          )
        }

        await prisma.member.update({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
          data: {
            role,
          },
        })

        return reply.status(204).send()
      }
    )
}
