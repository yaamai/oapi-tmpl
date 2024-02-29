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
        bbb_fuga_id:
          name: bbb_fuga_id
          type: number
          foreign:
            keyname: bbb_fuga_id
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
    results:
      name: results
      altname: results
      columns:
        matrix_id:
          name: matrix_id
          type: number
          foreign:
            keyname: matrix_id
            tablename: matrixs
            refname: "#/components/schemas/Matrix"
    matrixs:
      name: matrixs
      altname: matrixs
      columns:
        row_id:
          name: row_id
          type: number
          foreign:
            keyname: row_id
            tablename: rows
            refname: "#/components/schemas/Row"
    rows:
      name: rows
      altname: rows
      columns:
        'no':
          name: 'no'
          type: number
          foreign: 
        desc:
          name: desc
          type: string
          foreign: 
        figure_id:
          name: figure_id
          type: number
          foreign:
            keyname: figure_id
            tablename: figures
            refname: "#/components/schemas/Figure"
    figures:
      name: figures
      altname: figures
      columns:
        figure_base_id:
          name: figure_base_id
          type: number
          foreign:
            keyname: figure_base_id
            tablename: figure_bases
            refname: "#/components/schemas/FigureBase"
        rect_id:
          name: rect_id
          type: number
          foreign:
            keyname: rect_id
            tablename: rects
            refname: "#/components/schemas/Rect"
        circle_id:
          name: circle_id
          type: number
          foreign:
            keyname: circle_id
            tablename: circles
            refname: "#/components/schemas/Circle"
    figure_bases:
      name: figure_bases
      altname: figure_bases
      columns:
        name:
          name: name
          type: string
          foreign: 
    rects:
      name: rects
      altname: rects
      columns:
        a_point_id:
          name: a_point_id
          type: number
          foreign:
            keyname: a_point_id
            tablename: points
            refname: "#/components/schemas/Point"
        b_point_id:
          name: b_point_id
          type: number
          foreign:
            keyname: b_point_id
            tablename: points
            refname: "#/components/schemas/Point"
    points:
      name: points
      altname: points
      columns:
        y:
          name: y
          type: number
          foreign: 
        x:
          name: x
          type: number
          foreign: 
    circles:
      name: circles
      altname: circles
      columns:
        radius:
          name: radius
          type: number
          foreign: 
        center_point_id:
          name: center_point_id
          type: number
          foreign:
            keyname: center_point_id
            tablename: points
            refname: "#/components/schemas/Point"
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
            a:
              $ref: "#/components/schemas/Point"
            b:
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
