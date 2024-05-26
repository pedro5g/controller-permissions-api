import { Member, Organization } from '@prisma/client'
import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId: () => Promise<string>
    getMemberShip: (
      slug: string
    ) => Promise<{ organization: Organization; membership: Member }>
  }
}
