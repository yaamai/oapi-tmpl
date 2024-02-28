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
        aaa:
          name: aaa
          type: string
          foreign: null
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
        bbb:
          name: bbb
          type: number
          foreign:
            keyname: bbb
            tablename: fugas
            refname: Fuga
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
        bbb:
          name: bbb
          type: number
          foreign:
            keyname: bbb
            tablename: fugas
            refname: Fuga
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
        bbb:
          name: bbb
          type: number
          foreign:
            keyname: bbb
            tablename: fugas
            refname: Fuga
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
`)

for(let test of TEST_DATA) {
  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var name = test.name
  let converter = new db.OAPIToDBConverter(name, doc.Model.Components.Schemas[name].Schema())
  converter.process()

  utils.assert(test.expect, converter.result, test.desc)
}

/*
const oapi = require('./scripts/oapi.js')



function iterSchemas(doc, callback) {
  const schemas = doc.Model.Components.Schemas
  Object.keys(schemas).forEach((name) => callback(name, schemas[name].Schema()))
}

function* iterProps(schema) {
  for(let propName of Object.keys(schema.Properties)) {
    const propSchema = schema.Properties[propName].Schema()
    const type = propSchema.Type[0]

    yield [propName, type, propSchema]
  }
}

function hasOnlyOneRefInAllOf(schema) {
  if (schema.AllOf.length == 0) {
    return false
  }
  return schema.AllOf.filter(s => s.Schema().ParentProxy.IsReference() && s.Schema().Type == "object").length == 1
}

function getRef(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)[0]
}

function arraySchemaToTable(ctx, name, schema) {
  // table name are commonly plural form
  let tablename = utils.toSnake(name) + "s"
  let tablenameJa = oapi.getJaName(schema, tablename)
  let table = ctx.ensureTable(tablename, tablenameJa)

  // primitive types are added to column with fixed column name and fixed id (array can't have id in jsonschema)
  let subType = schema.Items.A.Schema().Type[0]
  if(["number", "string", "integer", "boolean"].includes(subType)) {
    table.addColumn(new Column("id", "number", null))
    table.addColumn(new Column("value", subType, null))
  }
}

function objectSchemaToTable(ctx, name, schema) {
  // table name are commonly plural form
  const tablename = utils.toSnake(name) + "s"
  const tablenameJa = oapi.getJaName(schema, tablename)

  let table = ctx.ensureTable(tablename, tablenameJa)

  for(let [propName, propType, propSchema] of iterProps(schema)) {
    console.log(propName, propType, propSchema)

    // primitive types are always added to column
    if(["number", "string", "integer", "boolean"].includes(propType)) {
      table.addColumn(new Column(propName, propType, null))
      continue
    }

    // when object's property has object or allOf object, create column and 1:1 relation
    // similary rules apply when object's property has array or allOf array, create column and 1:1 relation
    let isRef = propSchema.ParentProxy.IsReference()
    let isAllOf = propSchema.AllOf.length > 0
    let allOfObjectSchemas = propSchema.AllOf.filter(s => s.Schema().ParentProxy.IsReference() && s.Schema().Type == "object")
    let allOfArraySchemas = propSchema.AllOf.filter(s => s.Schema().ParentProxy.IsReference() && s.Schema().Type == "array")

    if(propType == "object" && !isRef) console.warn("WARN: can't determine relation target")
    if(isAllOf && allOfObjectSchemas.length > 1) console.warn("WARN: can't determine relation target")

    if(propType == "object" && isRef) {
      let refname = getRef(propSchema)
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, "number", new Foreign(propName, tablename, refname)))
      continue
    }

    if(isAllOf && allOfObjectSchemas.length == 1) {
      let refname = getRef(allOfObjectSchemas[0].Schema())
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, "number", new Foreign(propName, tablename, refname)))
    }

    if(isAllOf && allOfArraySchemas.length == 1) {
      let refname = getRef(allOfArraySchemas[0].Schema())
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, "number", new Foreign(propName, tablename, refname)))
    }
  }

  return

  Object.keys(schema.Properties).forEach((propname) => {
    const propSchema = schema.Properties[propname].Schema()
    const type = propSchema.Type[0]
    const ref = oapi.getRef(propSchema)

    if (!ref && (type != "number" && type != "string" && type != "integer" && type != "boolean")) {
      console.log("WARN: not supported nested structure found", tablename, propname, type)
    }

    if (!ref) {
      ctx.tables[tablename][propname] = {type: type, _janame: oapi.getJaName(propSchema), desc: propSchema.Description}
    }

    if (ref) {
      ctx.rels.push({kind: "object-ref", fromname: propname, from: tablename, to: utils.toSnake(ref[0])})
    }
  })
}

function schemaToTable(ctx, name, schema) {
  if (schema.Type == "object") objectSchemaToTable(ctx, name, schema)
  if (schema.Type == "array") arraySchemaToTable(ctx, name, schema)
  if (schema.AllOf.length > 0) {
    for(let subSchema of schema.AllOf) {
      schemaToTable(ctx, name, subSchema.Schema())
    }
  }
}

console.log(JSON.stringify(new Table))

TEST_DATA = yaml(`


- desc: primitive in array
  expect:
    tables:
      hoges:
        name: hoges
        altname: hoges
        columns:
          id:
            name: id
            type: number
            foreign: null
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
    tables:
      hoges:
        name: hoges
        altname: hoges
        columns:
          id:
            name: id
            type: number
            foreign: null
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
  expect: {"tables":{"hoges":{"name":"hoges","altname":"","columns":{"id":{"name":"id","type":"number","foreign":null},"value":{"name":"value","type":"boolean","foreign":null}}}}}
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
`)

for(let test of TEST_DATA) {
  var ctx = new Context()

  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var name = test.name
  schemaToTable(ctx, name, doc.Model.Components.Schemas[name].Schema())

  utils.assert(test.expect, ctx, test.desc)
}
*/
