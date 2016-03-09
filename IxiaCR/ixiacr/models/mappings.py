from sqlalchemy import Table, Column, Integer, ForeignKey

from core import metadata

# Mapping for users to groups
user_groups = Table('user_groups', metadata,
                    Column('user_id', Integer, ForeignKey('users.id', onupdate="CASCADE", ondelete="CASCADE")),
                    Column('group_id', Integer, ForeignKey('groups.id', onupdate="CASCADE", ondelete="CASCADE"))
)

# Mapping users to EULA
user_eulas = Table('user_eulas', metadata,
                   Column('user_id', Integer, ForeignKey('users.id', onupdate="CASCADE", ondelete="CASCADE")),
                   Column('eula_id', Integer, ForeignKey('eulas.id', onupdate="CASCADE", ondelete="CASCADE"))
)

# Mapping group/perms for decorators that use object-level permissions
group_permissions = Table('group_permissions', metadata,
                          Column('group_id', Integer, ForeignKey('groups.id', onupdate="CASCADE", ondelete="CASCADE")),
                          Column('permission_id', Integer, ForeignKey('permissions.id', onupdate="CASCADE", ondelete="CASCADE"))
)