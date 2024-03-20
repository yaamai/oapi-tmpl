const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')
const schemas = require('./scripts/schema.js')

TEST_DATA = yaml(`
- desc: simple object
  expect:
    hoges:
      name: hoges
      altname: aa
      columns:
        aaa:
          name: aaa
          altname: aaa
          type: string
          desc: ""
          foreign: null
        bbb:
          name: bbb
          altname: bbb
          type: number
          desc: ""
          foreign: null
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
  console.log(test.input)
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var ctx = new schemas.Context()
  let schema = doc.Model.Components.Schemas[test.name].Schema()
  schemas.schemaToTable(ctx, test.name, schema)

  utils.assert(test.expect, ctx, test.desc)
}
