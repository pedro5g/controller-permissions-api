import z from 'zod'
import { projectSubject } from './subjects/project'
import { userSubject } from './user'
import { organizationSubject } from './subjects/organization'
import { inviteSubject } from './subjects/invite'
import { billingSubject } from './subjects/billing'
import {
  AbilityBuilder,
  CreateAbility,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability'
import { User } from './models/user'
import { permissions } from './permissions'

const appAbilitySchema = z.union([
  userSubject,
  organizationSubject,
  projectSubject,
  inviteSubject,
  billingSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilitiesType = z.infer<typeof appAbilitySchema>
export type AppAbility = MongoAbility<AppAbilitiesType>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permission for role ${user.role} not found.`)
  }

  // pass user role as key value to object and execute your function
  permissions[user.role](user, builder)

  return builder.build({
    detectSubjectType(subject) {
      return subject.__typeName
    },
  })
}
