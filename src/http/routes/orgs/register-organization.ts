import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { prisma } from '@/http/lib/prisma'
import { BadRequestError } from '@/http/_errors/bad-request-error'
import { createSlug } from '@/utils/create-slug'

export async function registerOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .post(
      '/organization/register',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Create a new organization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            201: z.object({
              organizationId: z.string().uuid(),
              slug: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { name, domain, shouldAttachUsersByDomain } = request.body

        if (domain) {
          const organizationByDomain = await prisma.organization.findUnique({
            where: { domain },
          })

          if (organizationByDomain) {
            throw new BadRequestError(
              'Another organization with same domain already exists.'
            )
          }
        }
        const slug = createSlug(name)

        const organization = await prisma.organization.create({
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
            ownerId: userId,
            slug,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        return reply
          .status(201)
          .send({ organizationId: organization.id, slug: organization.slug })
      }
    )
}
