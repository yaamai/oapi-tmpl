const utils = require('./utils.js')

function schemaToTables(name, schema, ctx) {
  if (schema.Type == "object") {
    // table name are commonly plural form
    const tablename = utils.toSnake(name) + "s"
    ctx.tables[tablename] = {"_janame": utils.getJAName(schema), "_rels": {}}

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

  if (schema.Type == "array") {
    const tablename = utils.toSnake(name)
    ctx.tables[tablename] = {"_rels": {}, id: {type: "number"}, _janame: utils.getJAName(schema)}
  }
}

function resolveRelations(ctx) {
  ctx.rels.forEach((rel) => {
    // simple object-to-object 1:1 mapping
    if (rel.kind == "object-ref") {
      ctx.tables[rel.from][rel.fromname] = {type: "number", foreign: rel.to+".id"}
      ctx.tables[rel.from]["_rels"]["fk_"+rel.fromname] = {foreignKey: rel.fromname, references: rel.to, referencesKey: "id"}
    }
  })
}

function docToTables(doc) {
  var ctx = {tables: {}, rels: []}

  const schemas = doc.Model.Components.Schemas
  Object.keys(schemas).forEach((name) => {
    const schema = schemas[name].Schema()
    schemaToTables(name, schema, ctx)
  })

  resolveRelations(ctx)
  return ctx
}

function tablesToSQL(tables) {
  Object.keys(tables).forEach((tableName) => {
    console.log("CREATE TABLE %s(", tableName)
    Object.keys(tables[tableName]).forEach((colName) => {
      if(colName == "_rels") return
      console.log("  %s %s,", colName, tables[tableName][colName].type)
    })
    Object.keys(tables[tableName]["_rels"]).forEach((relname) => {
      const rel = tables[tableName]["_rels"][relname]
      console.log("  CONSTRAINT %s FOREIGN KEY(%s) REFERENCES %s(%s)", relname, rel.foreignKey, rel.references, rel.referencesKey)
    })
    console.log(")")
  })
}

function tablesToExcel(book, tables) {
  Object.keys(tables).forEach((tableName) => {
    var pos = ["F8", "Q8", "AB8", "AK8", "AU8"]

    console.log("create", tableName, "sheet")
    var sheetName = tables[tableName]["_janame"]
    if (sheetName.split("\n").length > 0) {
      sheetName = sheetName.split("\n")[0]
    }

    sheetName = sheetName.slice(0, 20)
    sheetName = sheetName.replace("/", "")
    if (!sheetName) {
      console.log("WARN: ", sheetName)
      console.log(sheetName)
      console.log(JSON.stringify(tables[tableName]))
      return
    }
    utils.dup(book, "template", sheetName)

    Object.keys(tables[tableName]).filter(e => !e.startsWith("_")).forEach((colName) => {
      const col = tables[tableName][colName]
      utils.sets(book, sheetName, pos, [col._janame, colName, col.type, "", col.desc])
      pos = utils.offsets(pos, 1, 1)
    })
  })
}

exports.docToTables = docToTables
