import { defineAbilityFor } from '@/auth'
import { Roles } from '@/auth/models/roles'
import { userSchema } from '@/auth/models/user'

export const getUserPermission = (userId: string, role: Roles) => {
  const authUser = userSchema.parse({
    id: userId,
    role,
  })

  const ability = defineAbilityFor(authUser)

  return ability
}
