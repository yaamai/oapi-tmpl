# target data
```
User:
  roles:
    perms:
      type: string

User:
  type: object
  properties:
    roles:
      $ref: "#/components/RoleList"

RoleList:
 type: array
 items:
   $ref: "#/components/Role"

Role:
  type: array
  items:
    $ref: "#/components/Perm"

Perm:
  type: string
```

# table plan
```

Table users {
  id number
  role_list_id number
}

Table role_lists {
  id number
}

Table role_lists_roles {
  role_lists_id number
  role_id number
}

Table roles {
  id number
}

Table roles_perms {
  role_id number
  perm_id number
}

Table perms {
  id number
  value text
}
```

# example data
```

perms {
  1 read
  2 write
  3 delete
}

roles_perms {
  1 1
  1 2
  2 3
}

roles {
  1 "rw"
  2 "d"
}

role_lists_roles {
  1 1
  1 2
}

role_lists {
  1 "admin"
}

users {
  1
}

Perm(1, "read")
Perm(2, "write")
Perm(3, "delete")

Role(1, "rw", Perm(1, "read"), Perm(2, "write"))
Role(2, "d", Perm(3, "delete"))

RoleList(1, "admin", Role(1), Role(2))

User(1, "hoge", RoleList(1))

```
