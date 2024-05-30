import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'

export async function removeMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .delete(
      'organization/:slug/members/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Delete member',
          security: [{ BearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            memberId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, memberId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getMemberShip(slug)

        const { cannot } = getUserPermission(userId, membership.role)

        if (cannot('delete', 'User')) {
          throw new UnauthorizedError(
            `You're not allowed to remove this member`
          )
        }

        await prisma.member.delete({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
        })

        return reply.status(204).send()
      }
    )
}
