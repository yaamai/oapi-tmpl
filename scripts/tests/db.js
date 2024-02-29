const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')

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
          desc: null
          foreign: null
        bbb:
          name: bbb
          altname: bbb
          type: number
          desc: null
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
          description: a
          x-janame: aa
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
          altname: aaa
          type: string
          desc: null
          foreign: null
        bbb:
          name: bbb
          altname: bbb
          type: number
          desc: null
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
          altname: fuga_id
          type: number
          desc: null
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
        foo_id:
          name: foo_id
          altname: foo_id
          type: number
          desc: null
          foreign:
            keyname: foo_id
            tablename: foos
            refname: "#/components/schemas/Foo"
    foos:
      name: foos
      altname: foos
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        aaa:
          name: aaa
          altname: aaa
          type: string
          desc: null
          foreign: null
    fugas:
      name: fugas
      altname: fugas
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        bbb:
          name: bbb
          altname: bbb
          type: integer
          desc: null
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
          altname: aaa
          type: string
          desc: null
          foreign: null
        bbb_fuga_id:
          name: bbb_fuga_id
          altname: bbb_fuga_id
          type: number
          desc: null
          foreign:
            keyname: bbb_fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        ccc:
          name: "ccc"
          altname: "ccc"
          type: "integer"
          desc: null
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
          altname: aaa
          type: string
          desc: null
          foreign: null
        fuga_id:
          name: fuga_id
          altname: fuga_id
          type: number
          desc: null
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        ccc:
          name: "ccc"
          altname: "ccc"
          type: "integer"
          desc: null
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
          altname: aaa
          type: string
          desc: null
          foreign: null
        fuga_id:
          name: fuga_id
          altname: fuga_id
          type: number
          desc: null
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        value:
          name: "value"
          altname: "value"
          type: "string"
          desc: null
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
          altname: value
          type: string
          desc: null
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
          altname: value
          type: boolean
          desc: null
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
      altname: hoges
      columns:
        fuga_id:
          name: fuga_id
          altname: fuga_id
          type: number
          desc: null
          foreign:
            keyname: fuga_id
            tablename: fugas
            refname: "#/components/schemas/Fuga"
    fugas:
      name: "fugas"
      altname: "fugas"
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        aaa:
          name: "aaa"
          altname: "aaa"
          type: "string"
          desc: null
          foreign: null
        bbb:
          name: "bbb"
          altname: "bbb"
          type: "string"
          desc: null
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
          altname: matrix_id
          type: number
          desc: null
          foreign:
            keyname: matrix_id
            tablename: matrixs
            refname: "#/components/schemas/Matrix"
    matrixs:
      name: matrixs
      altname: mat
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        row_id:
          name: row_id
          altname: row_id
          type: number
          desc: null
          foreign:
            keyname: row_id
            tablename: rows
            refname: "#/components/schemas/Row"
    rows:
      name: rows
      altname: rows
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        'no':
          name: 'no'
          altname: 'no'
          type: number
          desc: null
          foreign: 
        desc:
          name: desc
          altname: desc
          type: string
          desc: null
          foreign: 
        figure_id:
          name: figure_id
          altname: figure_id
          type: number
          desc: null
          foreign:
            keyname: figure_id
            tablename: figures
            refname: "#/components/schemas/Figure"
    figures:
      name: figures
      altname: figures
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        figure_base_id:
          name: figure_base_id
          altname: figure_base_id
          type: number
          desc: null
          foreign:
            keyname: figure_base_id
            tablename: figure_bases
            refname: "#/components/schemas/FigureBase"
        rect_id:
          name: rect_id
          altname: rect_id
          type: number
          desc: null
          foreign:
            keyname: rect_id
            tablename: rects
            refname: "#/components/schemas/Rect"
        circle_id:
          name: circle_id
          altname: circle_id
          type: number
          desc: null
          foreign:
            keyname: circle_id
            tablename: circles
            refname: "#/components/schemas/Circle"
    figure_bases:
      name: figure_bases
      altname: figure_bases
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        name:
          name: name
          altname: name
          type: string
          desc: null
          foreign: 
    rects:
      name: rects
      altname: rects
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        a_point_id:
          name: a_point_id
          altname: a_point_id
          type: number
          desc: null
          foreign:
            keyname: a_point_id
            tablename: points
            refname: "#/components/schemas/Point"
        b_point_id:
          name: b_point_id
          altname: b_point_id
          type: number
          desc: null
          foreign:
            keyname: b_point_id
            tablename: points
            refname: "#/components/schemas/Point"
    points:
      name: points
      altname: points
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        y:
          name: y
          altname: y
          type: number
          desc: null
          foreign: 
        x:
          name: x
          altname: x
          type: number
          desc: null
          foreign: 
    circles:
      name: circles
      altname: circles
      columns:
        id:
          name: id
          altname: id
          type: number
          desc: null
          foreign:
        radius:
          name: radius
          altname: radius
          type: number
          desc: null
          foreign: 
        center_point_id:
          name: center_point_id
          altname: center_point_id
          type: number
          desc: null
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
          description: mat
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
