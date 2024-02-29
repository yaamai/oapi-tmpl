const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')

TEST_DATA = yaml(`
- desc: simple object
  expect:
    hoges:
      name: hoges
      altname: hoges
      columns:
        aaa:
          name: aaa
          type: string
          foreign: null
        bbb:
          name: bbb
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
              type: string
            bbb:
              type: number

- desc: simple object with primitive ref
  expect:
    hoges:
      name: hoges
      altname: hoges
      columns:
        aaa:
          name: aaa
          type: string
          foreign: null
        bbb:
          name: bbb
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
      altname: hoges
      columns:
        fuga_id:
          name: fuga_id
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
        foo_id:
          name: foo_id
          type: number
          foreign:
            keyname: foo_id
            tablename: foos
            refname: "#/components/schemas/Foo"
    foos:
      name: foos
      altname: foos
      columns:
        aaa:
          name: aaa
          type: string
          foreign: null
    fugas:
      name: fugas
      altname: fugas
      columns:
        bbb:
          name: bbb
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
      altname: hoges
      columns:
        aaa:
          name: aaa
          type: string
          foreign: null
        fuga_id:
          name: fuga_id
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        ccc:
          name: "ccc"
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
      altname: hoges
      columns:
        aaa:
          name: aaa
          type: string
          foreign: null
        fuga_id:
          name: fuga_id
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        ccc:
          name: "ccc"
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
      altname: hoges
      columns:
        aaa:
          name: aaa
          type: string
          foreign: null
        fuga_id:
          name: fuga_id
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        value:
          name: "value"
          type: "string"
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
      altname: hoges
      columns:
        value:
          name: value
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
      altname: hoges
      columns:
        value:
          name: value
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

- desc: objectt in array
  expect:
    hoges:
      name: hoges
      altname: hoges
      columns:
        fuga_id:
          name: fuga_id
          type: number
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        aaa:
          name: "aaa"
          type: "string"
          foreign: null
        bbb:
          name: "bbb"
          type: "string"
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
  let converter = new db.OAPIToDBConverter(name, doc.Model.Components.Schemas[name].Schema())
  converter.process()

  utils.assert(test.expect, converter.result, test.desc)
}
