const utils = require('./scripts/utils.js')
const oapi = require('./scripts/oapi.js')

TEST_DATA = yaml(`
- desc: primitive
  expect:
  - name: Hoge
    type: string
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  name: Result
  input: |
    openapi: 3.0.1
    info:
      title: api
      version: 1.0.0
    paths: {}
    components:
      schemas:
        Result:
          type: object
          properties:
            Matrix:
              $ref: "#/components/schemas/Matrix"
        Matrix:
          type: array
          items:
            $ref: "#/components/schemas/Row"
        Row:
          type: object
          properties:
            aaa:
              type: string
            bbb:
              type: number
`)

for(let test of TEST_DATA) {
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var name = test.name
  const schema = doc.Model.Components.Schemas[name].Schema()
  const actual = oapi.traverse(name, schema, () => {}, () => {})

  utils.assert(test.expect, actual, test.desc)
}
