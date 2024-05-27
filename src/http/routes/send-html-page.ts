import { FastifyInstance } from 'fastify'
import { htmlTemplate } from '../../utils/page-template'
import z from 'zod'

// This route is testing only, it send a html page it content a form for password recover
// Don't do this in production
export async function sendHtmlPage(app: FastifyInstance) {
  app.get('/reset-password/:code', async (request, reply) => {
    const { code } = z.object({ code: z.string().uuid() }).parse(request.params)

    return reply.type('text/html').send(htmlTemplate(code))
  })
}
