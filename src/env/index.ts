import { z } from 'zod'

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_EXPIRATION_TIME: z.string(),
  PORT: z.coerce.number().default(3333),
  GITHUB_OAUTH_CLIENT_ID: z.string(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string(),
  GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string(),
  EMAIL_SERVICE: z.string().default('gmail'),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_ADDRESS: z.string().email(),
  EMAIL_PASSWORD: z.string(),
})

const _env = environmentSchema.safeParse(process.env)

if (!_env.success) {
  console.error('Environment variable error.', _env.error.flatten().fieldErrors)
  throw new Error(`Environment variable error.`)
}

export const env = _env.data
