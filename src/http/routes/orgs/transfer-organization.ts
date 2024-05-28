import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { organizationSchema } from '@/auth/models/organization'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { BadRequestError } from '@/http/_errors/bad-request-error'

export async function transferOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .patch(
      '/organization/:slug/owner',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Transfer organization ownership',
          security: [{ bearerAuth: [] }],
          body: z.object({
            transferToUserId: z.string().uuid(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getMemberShip(slug)

        const authOrganization = organizationSchema.parse(organization)

        const { cannot } = getUserPermission(userId, membership.role)

        if (cannot('transfere_ownership', authOrganization)) {
          throw new UnauthorizedError(
            `You're not allowed to transfer this organization ownership.`
          )
        }

        const { transferToUserId } = request.body

        const transferMembership = await prisma.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: transferToUserId,
            },
          },
        })

        if (!transferMembership) {
          throw new BadRequestError(
            'Target user is not a member of this organization.'
          )
        }

        await prisma.$transaction([
          prisma.member.update({
            where: {
              organizationId_userId: {
                organizationId: organization.id,
                userId: transferToUserId,
              },
            },
            data: {
              role: 'ADMIN',
            },
          }),
          prisma.organization.update({
            where: { id: organization.id },
            data: { ownerId: transferToUserId },
          }),
        ])

        return reply.status(204).send()
      }
    )
}
