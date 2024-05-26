import { z } from 'zod'

export const projectSchema = z.object({
  __typeName: z.literal('Project').default('Project'),
  id: z.string(),
  ownerId: z.string(),
})

export type User = z.infer<typeof projectSchema>
