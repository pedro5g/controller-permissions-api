import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { rolesSchema } from '@/auth/models/roles'

export async function getMembership(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .get(
      '/organization/:slug/membership',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get user membership on organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              id: z.string().uuid(),
              role: rolesSchema,
              organizationId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { membership } = await request.getMemberShip(slug)

        return reply.status(200).send({
          id: membership.id,
          role: membership.role,
          organizationId: membership.organizationId,
        })
      }
    )
}
