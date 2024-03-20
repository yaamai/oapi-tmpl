const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')
const schemas = require('./scripts/schema.js')

TEST_DATA = yaml(`
- desc: simple object
  expect:
    perms:
      name: perms
      altname: Perm
      columns:
        hoge:
          name: hoge
          altname: hoge
          type: string
          foreign: null
    role_lists:
      name: role_lists
      altname: RoleList
      columns:
        id:
          name: id
          altname: "識別子"
          type: number
          foreign: null
    role_lists_roles:
      name: role_lists_roles
      altname: "関連付けテーブル(role_lists-roles)"
      columns:
        role_lists_id:
          name: role_lists_id
          altname: "RoleList識別子"
          type: number
          foreign:
            keyname: role_lists_id
            tablename: role_lists
            refname: RoleList
        role_id:
          name: role_id
          altname: "Role識別子"
          type: number
          foreign:
            keyname: role_id
            tablename: roles
            refname: Role
    roles:
      name: roles
      altname: Role
      columns:
        id:
          name: id
          altname: "識別子"
          type: number
          foreign: null
    roles_perms:
      name: roles_perms
      altname: "関連付けテーブル(roles-perms)"
      columns:
        roles_id:
          name: roles_id
          altname: "Role識別子"
          type: number
          foreign:
            keyname: roles_id
            tablename: roles
            refname: Role
        perm_id:
          name: perm_id
          altname: "Perm識別子"
          type: number
          foreign:
            keyname: perm_id
            tablename: perms
            refname: Perm
  name: RoleList
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        RoleList:
          type: array
          items:
            $ref: "#/components/schemas/Role"
        Role:
          type: array
          items:
            $ref: "#/components/schemas/Perm"
        Perm:
          type: object
          properties:
            hoge:
              type: string
`)

for(let test of TEST_DATA) {
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var ctx = new schemas.Context()
  for(let [name, s] of schemas.iterSchemas(doc)) {
    schemas.schemaToTable(ctx, name, s)
  }

  utils.assert(test.expect, ctx.tables, test.desc)
}
