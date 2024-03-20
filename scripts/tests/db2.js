const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')
const schemas = require('./scripts/schema.js')

TEST_DATA = yaml(`
- desc: test description overwrite order
  expect:
    hoges:
      name: hoges
      altname: bbb
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
    foos:
      name: foos
      altname: aaa
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          allOf:
          - $ref: "#/components/schemas/Foo"
          - description: bbb
        Foo:
          type: object
          description: aaa
          properties:
            aaa:
              type: string

- desc: simple object with primitive ref
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
        bbb:
          name: bbb
          altname: bbb
          type: number
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: object
          properties:
            aaa:
              $ref: "#/components/schemas/Foo"
            bbb:
              type: number
        Foo:
          type: string

- desc: allOf object
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
        bbb:
          name: bbb
          altname: bbb
          type: integer
          foreign: null
    foos:
      name: foos
      altname: Foo
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
    fugas:
      name: fugas
      altname: Fuga
      columns:
        bbb:
          name: bbb
          altname: bbb
          type: integer
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          allOf:
          - $ref: "#/components/schemas/Fuga"
          - $ref: "#/components/schemas/Foo"
        Foo:
          type: object
          properties:
            aaa:
              type: string
        Fuga:
          type: object
          properties:
            bbb:
              type: integer

- desc: object with object ref
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
        fuga_id:
          name: fuga_id
          altname: bbb
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "Fuga"
    fugas:
      name: "fugas"
      altname: "Fuga"
      columns:
        ccc:
          name: "ccc"
          altname: "ccc"
          type: "integer"
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: object
          properties:
            aaa:
              type: string
            bbb:
              $ref: "#/components/schemas/Fuga"
        Fuga:
          type: object
          properties:
            ccc:
              type: integer

- desc: object with allOf object ref
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
        fuga_id:
          name: fuga_id
          altname: bbb
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "Fuga"
    fugas:
      name: "fugas"
      altname: Fuga
      columns:
        ccc:
          name: "ccc"
          altname: "ccc"
          type: "integer"
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: object
          properties:
            aaa:
              type: string
            bbb:
              allOf:
              - description: bbb
              - $ref: "#/components/schemas/Fuga"
        Fuga:
          type: object
          properties:
            ccc:
              type: integer

- desc: object with allOf array ref
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          foreign: null
        fuga_id:
          name: fuga_id
          altname: bbb
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "Fuga"
    fugas:
      name: "fugas"
      altname: Fuga
      columns:
        id:
          name: "id"
          altname: "識別子"
          type: number
          foreign: null
        value:
          name: "value"
          altname: "値"
          type: string
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: object
          properties:
            aaa:
              type: string
            bbb:
              allOf:
              - description: bbb
              - $ref: "#/components/schemas/Fuga"
        Fuga:
          type: array
          items:
            type: string

- desc: primitive in array
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        id:
          name: "id"
          altname: "識別子"
          type: number
          foreign: null
        value:
          name: "value"
          altname: "値"
          type: string
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: array
          items:
            type: string

- desc: primitive ref in array
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        id:
          name: id
          altname: "識別子"
          type: number
          foreign: null
        value:
          name: value
          altname: "値"
          type: boolean
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: array
          items:
            $ref: "#/components/schemas/Fuga"
        Fuga:
          type: boolean

- desc: object in array
  expect:
    hoges:
      name: hoges
      altname: Hoge
      columns:
        id:
          name: id
          altname: "識別子"
          type: number
          foreign: null
    hoges_fugas:
      name: hoges_fugas
      altname: "関連付けテーブル(hoges-fugas)"
      columns:
        hoges_id:
          name: hoges_id
          altname: "Hoge識別子"
          type: number
          foreign:
            keyname: hoges_id
            tablename: hoges
            refname: Hoge
        fuga_id:
          name: fuga_id
          altname: "Fuga識別子"
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: Fuga
    fugas:
      name: "fugas"
      altname: Fuga
      columns:
        aaa:
          name: "aaa"
          altname: "aaa"
          type: "string"
          foreign: null
        bbb:
          name: bbb
          altname: bbb
          type: string
          foreign: null
  name: Hoge
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Hoge:
          type: array
          items:
            $ref: "#/components/schemas/Fuga"
        Fuga:
          type: object
          properties:
            aaa:
              type: string
            bbb:
              type: string

# - desc: primitive
#   expect:
#     results:
#       name: results
#       altname: results
#       columns:
#         matrix_id:
#           name: matrix_id
#           altname: matrix_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: matrix_id
#             tablename: matrixs
#             refname: "#/components/schemas/Matrix"
#     matrixs:
#       name: matrixs
#       altname: mat
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         row_id:
#           name: row_id
#           altname: row_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: row_id
#             tablename: rows
#             refname: "#/components/schemas/Row"
#     rows:
#       name: rows
#       altname: rows
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         'no':
#           name: 'no'
#           altname: 'no'
#           type: number
#           desc: ""
#           foreign: 
#         desc:
#           name: desc
#           altname: desc
#           type: string
#           desc: ""
#           foreign: 
#         figure_id:
#           name: figure_id
#           altname: figure_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: figure_id
#             tablename: figures
#             refname: "#/components/schemas/Figure"
#     figures:
#       name: figures
#       altname: figures
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         figure_base_id:
#           name: figure_base_id
#           altname: figure_base_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: figure_base_id
#             tablename: figure_bases
#             refname: "#/components/schemas/FigureBase"
#         rect_id:
#           name: rect_id
#           altname: rect_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: rect_id
#             tablename: rects
#             refname: "#/components/schemas/Rect"
#         circle_id:
#           name: circle_id
#           altname: circle_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: circle_id
#             tablename: circles
#             refname: "#/components/schemas/Circle"
#     figure_bases:
#       name: figure_bases
#       altname: figure_bases
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         name:
#           name: name
#           altname: name
#           type: string
#           desc: ""
#           foreign: 
#     rects:
#       name: rects
#       altname: rects
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         a_point_id:
#           name: a_point_id
#           altname: a_point_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: a_point_id
#             tablename: points
#             refname: "#/components/schemas/Point"
#         b_point_id:
#           name: b_point_id
#           altname: b_point_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: b_point_id
#             tablename: points
#             refname: "#/components/schemas/Point"
#     points:
#       name: points
#       altname: points
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         y:
#           name: y
#           altname: y
#           type: number
#           desc: ""
#           foreign: 
#         x:
#           name: x
#           altname: x
#           type: number
#           desc: ""
#           foreign: 
#     circles:
#       name: circles
#       altname: circles
#       columns:
#         id:
#           name: id
#           altname: id
#           type: number
#           desc: ""
#           foreign:
#         radius:
#           name: radius
#           altname: aa
#           type: number
#           desc: "aa"
#           foreign: 
#         center_point_id:
#           name: center_point_id
#           altname: center_point_id
#           type: number
#           desc: ""
#           foreign:
#             keyname: center_point_id
#             tablename: points
#             refname: "#/components/schemas/Point"
#   name: Result
#   input: |
#     openapi: 3.0.1
#     info:
#       title: api
#       version: 1.0.0
#     paths: {}
#     components:
#       schemas:
#         Result:
#           type: object
#           properties:
#             matrix:
#               $ref: "#/components/schemas/Matrix"
# 
#         Matrix:
#           type: array
#           description: mat
#           items:
#             $ref: "#/components/schemas/Row"
# 
#         Row:
#           type: object
#           properties:
#             no:
#               type: number
#             desc:
#               type: string
#             figure:
#               $ref: "#/components/schemas/Figure"
# 
#         Figure:
#           allOf:
#           - $ref: "#/components/schemas/FigureBase"
#           - oneOf:
#             - $ref: "#/components/schemas/Rect"
#             - $ref: "#/components/schemas/Circle"
# 
#         FigureBase:
#           type: object
#           properties:
#             name:
#               type: string
# 
#         Point:
#           type: object
#           properties:
#             x:
#               type: number
#             y:
#               type: number
# 
#         Rect:
#           type: object
#           properties:
#             a:
#               $ref: "#/components/schemas/Point"
#               # TODO: make this to allOf with description
#             b:
#               $ref: "#/components/schemas/Point"
# 
#         Circle:
#           type: object
#           properties:
#             center:
#               $ref: "#/components/schemas/Point"
#             radius:
#               type: number
#               description: aa

- desc: array to array
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
  // if (test.desc != "object in array") continue
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var ctx = new schemas.Context()
  for(let [name, s] of schemas.iterSchemas(doc)) {
    schemas.schemaToTable(ctx, name, s)
  }

  utils.assert(test.expect, ctx.tables, test.desc)
}
