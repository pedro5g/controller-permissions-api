import { User } from './models/user'
import { Roles } from './models/roles'
import { AbilityBuilder } from '@casl/ability'
import { AppAbility } from '.'

type PermissionByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>
) => void

// Record -> set a key and value a new object
export const permissions: Record<Roles, PermissionByRole> = {
  ADMIN(user, builder) {
    const { can, cannot } = builder
    can('manage', 'all')
    cannot(['transfere_ownership', 'update'], 'Organization')
    can(['transfere_ownership', 'update'], 'Organization', {
      ownerId: { $eq: user.id },
    })
  },
  MEMBER(user, builder) {
    const { can } = builder
    can('get', 'User')
    can(['create', 'get'], 'Project')
    can(['create', 'update'], 'Project', {
      ownerId: {
        $eq: user.id,
      },
    })
  },
  BILLING(_, builder) {
    const { can } = builder
    can('manage', 'Billing')
  },
}
