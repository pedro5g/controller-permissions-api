import { z } from 'zod'

// z.tuple() -> tupla is an array that contains two positions
// z.union() -> it's an array that contains predefined values it using z.literal()

export const userSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('User'),
])

export type UserSubject = z.infer<typeof userSubject>
