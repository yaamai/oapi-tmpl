const utils = require('./scripts/utils.js')
const oapi = require('./scripts/oapi.js')

TEST_DATA = yaml(`
- desc: allOf array and desc
  expect:
  - name: BBB
    type: array
    desc: "BBB"
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: AAA
    type: string
    desc: "AAA"
    parents: ["Hoge", "AAA"]
    indent: 1
    repeated: true
    required: false
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
          - description: "BBB"
        Foo:
          type: array
          items:
            type: string
            description: "AAA"

- desc: items without ref
  expect:
  - name: Hoge
    type: array
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: AAA
    type: string
    desc: ""
    parents: ["Hoge", "AAA"]
    indent: 1
    repeated: true
    required: false
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
            x-janame: AAA

# TODO: check ref in ref
- desc: mixed oneOf,allOf
  expect:
  - name: Bobject
    type: object
    desc: "Bobject"
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: IDID
    type: string
    desc: "IDID"
    parents: ["Hoge", "id"]
    indent: 1
    repeated: false
    required: false
  - name: aa
    type: string
    desc: "aa"
    parents: ["Hoge", "a"]
    indent: 1
    repeated: false
    required: false
  - name: bb
    type: number
    desc: "bb"
    parents: ["Hoge", "b"]
    indent: 1
    repeated: false
    required: false
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
    desc: "BBB"
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: CCC
    type: string
    desc: "CCC"
    parents: ["Hoge", "aaa"]
    indent: 1
    repeated: false
    required: false
  - name: DDD
    type: array
    desc: "DDD"
    parents: ["Hoge", "bbb"]
    indent: 1
    repeated: false
    required: true
  - name: EEE
    type: object
    desc: "EEE"
    parents: ["Hoge", "bbb", "Bar"]
    indent: 2
    repeated: true
    required: false
  - name: FFF
    type: array
    desc: "FFF"
    parents: ["Hoge", "bbb", "Bar", "list"]
    indent: 3
    repeated: false
    required: false
  - name: GGG
    type: object
    desc: "GGG"
    parents: ["Hoge", "bbb", "Bar", "list", "Baz"]
    indent: 4
    repeated: true
    required: false
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
          required: [bbb]
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
    desc: "BBB"
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: CCC
    type: string
    desc: "CCC"
    parents: ["Hoge", "aaa"]
    indent: 1
    repeated: false
    required: false
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
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: aaa
    type: string
    desc: ""
    parents: ["Hoge", "aaa"]
    indent: 1
    repeated: false
    required: false
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
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: aaa
    type: string
    desc: ""
    parents: ["Hoge", "aaa"]
    indent: 1
    repeated: false
    required: false
  - name: ccc
    type: string
    desc: ""
    parents: ["Hoge", "ccc"]
    indent: 1
    repeated: false
    required: false
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
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: Fuga
    type: array
    desc: ""
    parents: ["Hoge", "Fuga"]
    indent: 1
    repeated: true
    required: false
  - name: Foo
    type: object
    desc: ""
    parents: ["Hoge", "Fuga", "Foo"]
    indent: 2
    repeated: true
    required: false
  - name: ccc
    type: string
    desc: ""
    parents: ["Hoge", "Fuga", "Foo", "ccc"]
    indent: 3
    repeated: false
    required: false
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
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: Foo
    type: object
    desc: ""
    parents: ["Hoge", "Foo"]
    indent: 1
    repeated: true
    required: false
  - name: ccc
    type: string
    desc: ""
    parents: ["Hoge", "Foo", "ccc"]
    indent: 2
    repeated: false
    required: false
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
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: aaa
    type: string
    desc: ""
    parents: ["Hoge", "aaa"]
    indent: 1
    repeated: false
    required: false
  - name: bbb
    type: object # TODO: check this is correct or not.
    desc: ""
    parents: ["Hoge", "bbb"]
    indent: 1
    repeated: false
    required: false
  - name: ccc
    type: string
    desc: ""
    parents: ["Hoge", "bbb", "ccc"]
    indent: 2
    repeated: false
    required: true
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
          required: [ccc]
          properties:
            ccc:
              type: string

- desc: primitive in array
  expect:
  - name: Hoge
    type: array
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: Foo
    type: string
    desc: ""
    parents: ["Hoge", "Foo"]
    indent: 1
    repeated: true
    required: false
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
    desc: ""
    parents: ["Hoge"]
    indent: 0
    repeated: false
    required: false
  - name: aaa
    type: string
    desc: ""
    parents: ["Hoge", "aaa"]
    indent: 1
    repeated: false
    required: false
  - name: bbb
    type: string
    desc: ""
    parents: ["Hoge", "bbb"]
    indent: 1
    repeated: false
    required: true
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
          required: [bbb]
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
  const actual = oapi.flatten(name, [], schema, 0, false)

  utils.assert(test.expect, actual, test.desc)
}
