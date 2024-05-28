import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { projectSchema } from '@/auth/models/project'
import { BadRequestError } from '@/http/_errors/bad-request-error'

export async function deleteProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .delete(
      '/project/:slug/delete/:projectId',
      {
        schema: {
          tags: ['Project'],
          summary: 'Delete project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            projectId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, projectId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getMemberShip(slug)

        const project = await prisma.project.findUnique({
          where: { id: userId, organizationId: organization.id },
        })

        if (!project) {
          throw new BadRequestError('Project not found')
        }

        const { cannot } = getUserPermission(userId, membership.role)
        const authProject = projectSchema.parse(project)

        if (cannot('delete', authProject)) {
          throw new UnauthorizedError(
            "You're not allowed to delete this project"
          )
        }

        await prisma.project.delete({
          where: {
            id: projectId,
          },
        })

        return reply.status(204).send()
      }
    )
}
