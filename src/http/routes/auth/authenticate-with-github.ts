import { env } from '@/env'
import { BadRequestError } from '@/http/_errors/bad-request-error'
import { prisma } from '@/http/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function authenticateWithGithub(app: FastifyInstance) {
  // delete this route in production
  app.withTypeProvider<ZodTypeProvider>().get(
    '/login/github',
    {
      schema: {
        tags: ['Utility routes'],
        summary: 'This routes is only to testing without need a html page.',
        description:
          '<b>This route cannot be tested in the swagger documentation. To do this, access the url in "localhost"</b>',
      },
    },
    async (_request, reply) => {
      const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_OAUTH_CLIENT_REDIRECT_URI)}&scope=user:email`
      reply.redirect(redirectUrl)
    }
  )

  app.withTypeProvider<ZodTypeProvider>().get(
    '/login/github/callback',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with github',
        querystring: z.object({
          code: z.string(),
        }),
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
      const { code } = request.query
      // console.log('code github: ', code)
      const githubOAuthURL = new URL(
        'https://github.com/login/oauth/access_token'
      )
      githubOAuthURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
      githubOAuthURL.searchParams.set(
        'client_secret',
        env.GITHUB_OAUTH_CLIENT_SECRET
      )
      githubOAuthURL.searchParams.set(
        'redirect_uri',
        env.GITHUB_OAUTH_CLIENT_REDIRECT_URI
      )
      githubOAuthURL.searchParams.set('code', code)

      const githubAccessTokenResponse = await fetch(githubOAuthURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const githubAccessTokenData = await githubAccessTokenResponse.json()

      const { access_token: githubAccessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
        })
        .parse(githubAccessTokenData)

      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
        },
      })

      const githubUserData = await githubUserResponse.json()

      // console.log('git user data: ', githubUserData)

      const {
        id: githubId,
        name,
        email,
        avatar_url: avatarUrl,
      } = z
        .object({
          id: z.number().int().transform(String),
          avatar_url: z.string().url(),
          name: z.string().nullable(),
          email: z.string().nullable(),
        })
        .parse(githubUserData)

      if (email === null) {
        throw new BadRequestError(
          'Your GitHub account must have an email to authenticate.'
        )
      }

      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
          },
        })
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: githubId,
            userId: user.id,
          },
        })
      }

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
        .send({ token, user: { id: user.id, name, email, avatarUrl } })
    }
  )
}
