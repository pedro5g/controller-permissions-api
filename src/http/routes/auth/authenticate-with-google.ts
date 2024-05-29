import { env } from '@/env'
import { prisma } from '@/http/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

type GoogleTypeResponse = {
  access_token: string
  scope: string
  token_type: string
  id_token: string
}

type GoogleUserTypeResponse = {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: true
  local: string
}

export async function authenticateWithGoogle(app: FastifyInstance) {
  // delete this route in production
  app.withTypeProvider<ZodTypeProvider>().get(
    '/login/google',
    {
      schema: {
        tags: ['Utility routes'],
        summary: 'This routes is only to testing without need a html page.',
        description:
          '<b>This route cannot be tested in the swagger documentation. To do this, access the url in "localhost"</b>',
      },
    },
    (_request, reply) => {
      const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.REDIRECT_URI)}&scope=profile email`
      reply.redirect(redirectUrl)
    }
  )

  app.get(
    '/login/google/callback',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with google',
        response: {
          201: z.object({
            token: z.string(),
            user: z.object({
              id: z.string().uuid(),
              name: z.string().nullable(),
              email: z.string().email(),
              avatarUrl: z.string().url().nullable(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const querySchema = z.object({ code: z.string() })
      const { code } = querySchema.parse(request.query)
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: JSON.stringify({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_SECRET_KEY,
          redirect_uri: env.REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
        headers: { Accept: 'application/x-www-form-urlencoded' },
      })
      const tokenResponse = (await res.json()) as GoogleTypeResponse

      //console.log('token response', tokenResponse)
      const { access_token } = tokenResponse

      const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${access_token}` },
        }
      )
      const userData = (await userResponse.json()) as GoogleUserTypeResponse

      const { sub, name, email, picture } = userData

      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            name,
            email,
            avatarUrl: picture,
          },
        })
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GOOGLE',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GOOGLE',
            providerAccountId: sub,
            userId: user.id,
          },
        })
      }
      //console.log('user data', userData)
      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        }
      )

      return reply
        .status(201)
        .send({ token, user: { id: user.id, name, email, avatarUrl: picture } })
    }
  )
}
