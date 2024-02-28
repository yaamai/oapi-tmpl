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
            matrix:
              $ref: "#/components/schemas/Matrix"

        Matrix:
          type: array
          items:
            $ref: "#/components/schemas/Row"

        Row:
          type: object
          properties:
            no:
              type: number
            desc:
              type: string
            figure:
              $ref: "#/components/schemas/Figure"

        Figure:
          allOf:
          - $ref: "#/components/schemas/FigureBase"
          - oneOf:
            - $ref: "#/components/schemas/Rect"
            - $ref: "#/components/schemas/Circle"

        FigureBase:
          type: object
          properties:
            name:
              type: string

        Point:
          type: object
          properties:
            x:
              type: number
            y:
              type: number

        Rect:
          type: object
          properties:
            pt1:
              $ref: "#/components/schemas/Point"
            pt2:
              $ref: "#/components/schemas/Point"

        Circle:
          type: object
          properties:
            center:
              $ref: "#/components/schemas/Point"
            radius:
              type: number
`)

for(let test of TEST_DATA) {
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var name = test.name
  const schema = doc.Model.Components.Schemas[name].Schema()
  let traverser = new oapi.Traverser(name, schema, () => {}, () => {})
  actual = traverser.process()

  utils.assert(test.expect, actual, test.desc)
}
