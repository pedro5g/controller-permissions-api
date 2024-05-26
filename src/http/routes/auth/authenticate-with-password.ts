import { env } from '@/env'
import { prisma } from '@/http/lib/prisma'
import { compare } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/user/session/password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with e-mail and password.',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const userFromEmail = await prisma.user.findUnique({ where: { email } })
      if (!userFromEmail) {
        throw Error('Credentials invalid.')
      }

      if (!userFromEmail.passwordHash) {
        throw new Error(
          'User does not have a password. Please use social login.'
        )
      }

      if (!(await compare(password, userFromEmail.passwordHash))) {
        throw new Error('Credentials invalid.')
      }

      const token = await reply.jwtSign(
        { sub: userFromEmail.id },
        { expiresIn: env.JWT_EXPIRATION_TIME }
      )

      return reply.status(201).send({ token })
    }
  )
}
