import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authMiddleware } from '../middleware/auth-middleware'
import z from 'zod'
import { rolesSchema } from '@/auth/models/roles'
import { getUserPermission } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { BadRequestError } from '@/http/_errors/bad-request-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .post(
      'invite/create/:slug',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Create a new invite',
          security: [{ bearerAuth: [] }],
          body: z.object({
            email: z.string().email(),
            role: rolesSchema,
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              inviteId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { email, role } = request.body

        const userId = await request.getCurrentUserId()

        const { organization, membership } = await request.getMemberShip(slug)

        const { cannot } = getUserPermission(userId, membership.role)

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError(`You're not allowed to create invites`)
        }

        const [, domain] = email.split('@')

        if (
          organization.shouldAttachUsersByDomain &&
          domain !== organization.domain
        ) {
          throw new BadRequestError(
            `Users with '${domain}' domain will join your organization automatically on login.`
          )
        }

        const inviteWithSameEmail = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: organization.id,
            },
          },
        })

        if (inviteWithSameEmail) {
          throw new BadRequestError(
            'Another invite with same e-mail already exists.'
          )
        }

        const memberWithSomeEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: {
              email,
            },
          },
        })

        if (memberWithSomeEmail) {
          throw new BadRequestError(
            'A member with this e-mail already belongs to your organization.'
          )
        }

        const invite = await prisma.invite.create({
          data: {
            organizationId: organization.id,
            email,
            role,
            authorId: userId,
          },
        })

        return reply.status(201).send({ inviteId: invite.id })
      }
    )
}
