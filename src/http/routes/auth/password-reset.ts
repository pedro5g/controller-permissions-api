import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { prisma } from '@/http/lib/prisma'
import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function passwordReset(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/user/recover-password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Reset a new user password',
        body: z.object({
          code: z.string().uuid(),
          password: z.string().min(6),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, password } = request.body

      const tokenFromCode = await prisma.token.findUnique({
        where: { id: code },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError()
      }

      const passwordHash = await hash(password, 6)

      await prisma.user.update({
        where: {
          id: tokenFromCode.userId,
        },
        data: {
          passwordHash,
        },
      })
      await prisma.token.delete({
        where: {
          id: code,
        },
      })

      return reply.status(204).send()
    }
  )
}
