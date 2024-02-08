const utils = require('./scripts/utils.js')
const oapi = require('./scripts/oapi.js')

TEST_DATA = yaml(`
- desc: array and object deeply nested
  expect:
  - ["AAA", ["Hoge"], 0]
  - ["CCC", ["Hoge", "aaa"], 1]
  - ["DDD", ["Hoge", "bbb"], 1]
  - ["EEE", ["Hoge", "bbb", "Bar"], 2]
  - ["FFF", ["Hoge", "bbb", "Bar", "list"], 3]
  - ["GGG", ["Hoge", "bbb", "Bar", "list", "Baz"], 4]
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
          - x-janame: AAA
        Foo:
          type: object
          description: BBB
          properties:
            aaa:
              description: CCC
              type: string
            bbb:
              type: array
              description: DDD
              items:
                $ref: "#/components/schemas/Bar"
        Bar:
          type: object
          description: EEE
          properties:
            list:
              type: array
              description: FFF
              items:
                $ref: "#/components/schemas/Baz"
        Baz:
          type: object
          description: GGG

- desc: altname of object and description allOf
  expect:
  - ["AAA", ["Hoge"], 0]
  - ["CCC", ["Hoge", "aaa"], 1]
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
          - x-janame: AAA
        Foo:
          type: object
          description: BBB
          properties:
            aaa:
              description: CCC
              type: string

- desc: object and description allOf
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["aaa", ["Hoge", "aaa"], 1]
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
          - x-hogehoge: bbb
        Foo:
          type: object
          properties:
            aaa:
              type: string

- desc: all object allOf
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["aaa", ["Hoge", "aaa"], 1]
  - ["ccc", ["Hoge", "ccc"], 1]
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
          - $ref: "#/components/schemas/Bar"
        Foo:
          type: object
          properties:
            aaa:
              type: string
        Bar:
          type: object
          properties:
            ccc:
              type: string

- desc: array in array
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["Fuga", ["Hoge", "Fuga"], 1]
  - ["Foo", ["Hoge", "Fuga", "Foo"], 2]
  - ["ccc", ["Hoge", "Fuga", "Foo", "ccc"], 3]
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
          type: array
          items:
            $ref: "#/components/schemas/Foo"
        Foo:
          type: object
          properties:
            ccc:
              type: string


- desc: object ref in array
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["Foo", ["Hoge", "Foo"], 1]
  - ["ccc", ["Hoge", "Foo", "ccc"], 2]
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
            $ref: "#/components/schemas/Foo"
        Foo:
          type: object
          properties:
            ccc:
              type: string


- desc: object ref in object
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["aaa", ["Hoge", "aaa"], 1]
  - ["bbb", ["Hoge", "bbb"], 1]
  - ["ccc", ["Hoge", "bbb", "ccc"], 2]
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
              $ref: "#/components/schemas/Foo"
        Foo:
          type: object
          properties:
            ccc:
              type: string

- desc: primitive in array
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["Foo", ["Hoge", "Foo"], 1]
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
            $ref: "#/components/schemas/Foo"
        Foo:
          type: string

- desc: object
  expect:
  - ["Hoge", ["Hoge"], 0]
  - ["aaa", ["Hoge", "aaa"], 1]
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

- desc: primitive
  expect:
  - ["Hoge", ["Hoge"], 0]
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
          type: string
`)

for(let test of TEST_DATA) {
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var name = test.name
  const schema = doc.Model.Components.Schemas[name].Schema()
  const actual = oapi.flatten(name, [], schema, 0)

  utils.assert(test.expect, actual, test.desc)
}
