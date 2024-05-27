import { prisma } from '@/http/lib/prisma'
import { sendEmail } from '@/utils/send-email'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/user/recover-password/',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request a password recover',
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body
      const userFromEmail = await prisma.user.findUnique({ where: { email } })

      if (!userFromEmail) {
        return reply.status(200).send()
      }

      const { id } = await prisma.token.create({
        data: {
          type: 'PASSWORD_RECOVER',
          userId: userFromEmail.id,
        },
      })

      await sendEmail(email, id)

      return reply.status(200).send()
    }
  )
}
