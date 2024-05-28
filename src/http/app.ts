import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { env } from '@/env'
import { createAccount } from './routes/auth/create-account'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { authenticateWithGithub } from './routes/auth/authenticate-with-github'
import { globalErrorHandle } from './global-error-handle'
import { getProfile } from './routes/auth/get-profile'
import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { passwordReset } from './routes/auth/password-reset'
import { sendHtmlPage } from './routes/send-html-page'
import { registerOrganization } from './routes/orgs/register-organization'
import { getOrganization } from './routes/orgs/get-organization'
import { getOrganizations } from './routes/orgs/get-organizations'
import { updateOrganization } from './routes/orgs/update-organization'
import { disableOrganization } from './routes/orgs/disable-organization'
import { getMembership } from './routes/orgs/get-membership'
import { transferOrganization } from './routes/orgs/transfer-organization'
import { createProject } from './routes/projects/create-project'
import { updateProject } from './routes/projects/update-project'
import { deleteProject } from './routes/projects/delete-project'
import { getProject } from './routes/projects/get-project'
import { getProjects } from './routes/projects/get-projects'

export const app = fastify().withTypeProvider<ZodTypeProvider>()
app.register(cors)

// error handler
app.setErrorHandler(globalErrorHandle)

// set jwt config
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

// api documentation config
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Api SaaS',
      description: 'Api for a saas app',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

// auth route
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(authenticateWithGithub)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(passwordReset)
// testing password recovery
app.register(sendHtmlPage)

// organization routes
app.register(registerOrganization)
app.register(getOrganization)
app.register(getOrganizations)
app.register(updateOrganization)
app.register(disableOrganization)
app.register(getMembership)
app.register(transferOrganization)

// project routes
app.register(createProject)
app.register(updateProject)
app.register(deleteProject)
app.register(getProject)
app.register(getProjects)
