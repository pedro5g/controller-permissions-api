import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { UnauthorizedError } from './_errors/unauthorized-error'
import { BadRequestError } from './_errors/bad-request-error'

type FastifyErrorHandle = FastifyInstance['errorHandler']

export const globalErrorHandle: FastifyErrorHandle = async (
  error,
  request,
  reply
) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: `Validade error.`, error: error.flatten().fieldErrors })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({ message: error.message })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({ message: error.message })
  }

  console.error('Internal server error.', error.message)
  return reply.status(500).send({ message: 'Internal server error.' })
}
