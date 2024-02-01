const utils = require('./utils.js')
const schema = require('./schema.js')

class Context {
  constructor() {
    this.tables = {}
  }

  addTable(table) {
    this.tables[table.name] = table
  }
}

class Table {
  constructor(name, altname) {
    this.name = name
    this.altname = altname
    this.columns = {}
  }

  addColumn(column) {
    this.columns[column.name] = column
  }
}

class Column {
  constructor(name, type) {
    this.name = name
    this.type = type
  }
}


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

function objectSchemaToTable(ctx, name, schema) {
  // table name are commonly plural form
  const tablename = utils.toSnake(name) + "s"
  const tablenameJa = utils.getJAName(schema)

  let table = new Table(tablename, tablenameJa)
  ctx.addTable(table)

  for(let [propName, propType, propSchema] of iterProps(schema)) {
    console.log(propName, propType, propSchema)
    if(["number", "string", "integer", "boolean"].includes(propType)) {
      table.addColumn(new Column(propName, propType))
    }
  }

  return

  Object.keys(schema.Properties).forEach((propname) => {
    const propSchema = schema.Properties[propname].Schema()
    const type = propSchema.Type[0]
    const ref = utils.getRef(propSchema)

    if (!ref && (type != "number" && type != "string" && type != "integer" && type != "boolean")) {
      console.log("WARN: not supported nested structure found", tablename, propname, type)
    }

    if (!ref) {
      ctx.tables[tablename][propname] = {type: type, _janame: utils.getJAName(propSchema), desc: propSchema.Description}
    }

    if (ref) {
      ctx.rels.push({kind: "object-ref", fromname: propname, from: tablename, to: utils.toSnake(ref[0])})
    }
  })
}

function schemaToTable(ctx, name, schema) {
  if (schema.Type == "object") objectSchemaToTable(ctx, name, schema)
}

console.log(JSON.stringify(new Table))

TEST_DATA = yaml(`
- desc: simple object
  expect: {"tables":{"hoges":{"name":"hoges","altname":"","columns":{"bbb":{"name":"bbb","type":"number"},"aaa":{"name":"aaa","type":"string"}}}}}
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
`)

for(let test of TEST_DATA) {
  var ctx = new Context()

  var [doc, err] = openapischema(test.input)
  utils.assert(err, [])

  var name = test.name
  schemaToTable(ctx, name, doc.Model.Components.Schemas[name].Schema())

  utils.assert(ctx, test.expect, test.desc)
}
