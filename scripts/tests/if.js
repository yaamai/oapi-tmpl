const utils = require('./scripts/utils.js')
const oapi = require('./scripts/oapi.js')

TEST_DATA = yaml(`
- desc: mixed oneOf,allOf
  expect:
  - name: Hoge
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: IDID
    type: string
    parents: ["Hoge", "id"]
    indent: 1
  - name: aa
    type: string
    parents: ["Hoge", "a"]
    indent: 1
  - name: bb
    type: number
    parents: ["Hoge", "b"]
    indent: 1
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
          - $ref: "#/components/schemas/ID"
          - oneOf:
            - $ref: "#/components/schemas/A"
            - $ref: "#/components/schemas/B"
        ID:
          type: object
          properties:
            id:
              description: IDID
              type: string
        A:
          type: object
          description: Aobject
          properties:
            a:
              description: aa
              type: string
        B:
          type: object
          description: Bobject
          properties:
            b:
              description: bb
              type: number

- desc: array and object deeply nested
  expect:
  - name: AAA
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: CCC
    type: string
    parents: ["Hoge", "aaa"]
    indent: 1
  - name: DDD
    type: array
    parents: ["Hoge", "bbb"]
    indent: 1
  - name: EEE
    type: object
    parents: ["Hoge", "bbb", "Bar"]
    indent: 2
  - name: FFF
    type: array
    parents: ["Hoge", "bbb", "Bar", "list"]
    indent: 3
  - name: GGG
    type: object
    parents: ["Hoge", "bbb", "Bar", "list", "Baz"]
    indent: 4
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
  - name: AAA
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: CCC
    type: string
    parents: ["Hoge", "aaa"]
    indent: 1
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
  - name: Hoge
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: aaa
    type: string
    parents: ["Hoge", "aaa"]
    indent: 1
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
  - name: Hoge
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: aaa
    type: string
    parents: ["Hoge", "aaa"]
    indent: 1
  - name: ccc
    type: string
    parents: ["Hoge", "ccc"]
    indent: 1
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
  - name: Hoge
    type: array
    parents: ["Hoge"]
    indent: 0
  - name: Fuga
    type: array
    parents: ["Hoge", "Fuga"]
    indent: 1
  - name: Foo
    type: object
    parents: ["Hoge", "Fuga", "Foo"]
    indent: 2
  - name: ccc
    type: string
    parents: ["Hoge", "Fuga", "Foo", "ccc"]
    indent: 3
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
  - name: Hoge
    type: array
    parents: ["Hoge"]
    indent: 0
  - name: Foo
    type: object
    parents: ["Hoge", "Foo"]
    indent: 1
  - name: ccc
    type: string
    parents: ["Hoge", "Foo", "ccc"]
    indent: 2
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
  - name: Hoge
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: aaa
    type: string
    parents: ["Hoge", "aaa"]
    indent: 1
  - name: bbb
    type: object # TODO: check this is correct or not.
    parents: ["Hoge", "bbb"]
    indent: 1
  - name: ccc
    type: string
    parents: ["Hoge", "bbb", "ccc"]
    indent: 2
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
  - name: Hoge
    type: array
    parents: ["Hoge"]
    indent: 0
  - name: Foo
    type: string
    parents: ["Hoge", "Foo"]
    indent: 1
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
  - name: Hoge
    type: object
    parents: ["Hoge"]
    indent: 0
  - name: aaa
    type: string
    parents: ["Hoge", "aaa"]
    indent: 1
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
  - name: Hoge
    type: string
    parents: ["Hoge"]
    indent: 0
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
