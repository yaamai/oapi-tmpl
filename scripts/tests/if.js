const utils = require('./scripts/utils.js')
const oapi = require('./scripts/oapi.js')

TEST_DATA = yaml(`
- desc: mixed oneOf,allOf
  expect:
  - name: Hoge
    parents: ["Hoge"]
    indent: 0
  - name: IDID
    parents: ["Hoge", "id"]
    indent: 1
  - name: aa
    parents: ["Hoge", "a"]
    indent: 1
  - name: bb
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
    parents: ["Hoge"]
    indent: 0
  - name: CCC
    parents: ["Hoge", "aaa"]
    indent: 1
  - name: DDD
    parents: ["Hoge", "bbb"]
    indent: 1
  - name: EEE
    parents: ["Hoge", "bbb", "Bar"]
    indent: 2
  - name: FFF
    parents: ["Hoge", "bbb", "Bar", "list"]
    indent: 3
  - name: GGG
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
    parents: ["Hoge"]
    indent: 0
  - name: CCC
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
    parents: ["Hoge"]
    indent: 0
  - name: aaa
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
    parents: ["Hoge"]
    indent: 0
  - name: aaa
    parents: ["Hoge", "aaa"]
    indent: 1
  - name: ccc
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
    parents: ["Hoge"]
    indent: 0
  - name: Fuga
    parents: ["Hoge", "Fuga"]
    indent: 1
  - name: Foo
    parents: ["Hoge", "Fuga", "Foo"]
    indent: 2
  - name: ccc
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
    parents: ["Hoge"]
    indent: 0
  - name: Foo
    parents: ["Hoge", "Foo"]
    indent: 1
  - name: ccc
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
    parents: ["Hoge"]
    indent: 0
  - name: aaa
    parents: ["Hoge", "aaa"]
    indent: 1
  - name: bbb
    parents: ["Hoge", "bbb"]
    indent: 1
  - name: ccc
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
    parents: ["Hoge"]
    indent: 0
  - name: Foo
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
    parents: ["Hoge"]
    indent: 0
  - name: aaa
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
