import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { organizationSchema } from '@/auth/models/organization'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { BadRequestError } from '@/http/_errors/bad-request-error'

export async function updateOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .post(
      '/organization/:slug/update',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Update organization details',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
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
        const userId = await request.getCurrentUserId()
        const { slug } = request.params
        const { membership, organization } = await request.getMemberShip(slug)

        const { name, domain, shouldAttachUsersByDomain } = request.body

        const authOrganization = organizationSchema.parse(organization)

        const { cannot } = getUserPermission(userId, membership.role)

        if (cannot('update', authOrganization)) {
          throw new UnauthorizedError(
            "You're not allowed to update this organization."
          )
        }

        if (domain) {
          const organizationByDomain = await prisma.organization.findFirst({
            where: {
              domain,
              id: {
                not: organization.id,
              },
            },
          })

          if (organizationByDomain) {
            throw new BadRequestError(
              'Another organization with same email already exists.'
            )
          }
        }

        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
          },
        })

        return reply.status(200).send()
      }
    )
}
