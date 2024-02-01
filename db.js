function deepCompare (arg1, arg2) {
  if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)){
    if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]' ){
      if (Object.keys(arg1).length !== Object.keys(arg2).length ){
        return false;
      }
      return (Object.keys(arg1).every(function(key){
        return deepCompare(arg1[key],arg2[key]);
      }));
    }
    return (arg1===arg2);
  }
  return false;
}

function assert(a, b, m) {
  if (deepCompare(a, b)) {
    console.log("TEST: " + (m||"").padEnd(32) + ": OK")
  } else {
    console.log("TEST: " + (m||"").padEnd(32) + ": FAIL")
    console.log(JSON.stringify(a))
    console.log(JSON.stringify(b))
  }
}

function _toSnake(camel) {
  return camel.replace(/[A-Z][a-z]/g, c => `_${c.toLowerCase()}`).replace(/[A-Z]+/g, c => `_${c.toLowerCase()}`).replace(/^_/, "")
}

function _getRef(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)
}

// check allOf composition has empty property and refs
function getRef(schema) {
  var ref = _getRef(schema)
  if (ref) {
    return ref
  }

  if (schema.AllOf.length == 0) {
    return null
  }

  var hasMultipleObjectProperties = false
  schema.AllOf.forEach((s) => {
    var r = _getRef(s.Schema())
    if (Object.keys(s.Schema().Properties).length != 0 && !r) {
      hasMultipleObjectProperties = true
    }

    if (r) {
      ref = r
    }
  })
  
  if (hasMultipleObjectProperties) {
    return null
  } else {
    return ref
  }
}

function schemaToTables(name, schema, ctx) {
  if (schema.Type == "object") {
    // table name are commonly plural form
    const tablename = _toSnake(name) + "s"
    ctx.tables[tablename] = {"_rels": {}}

    Object.keys(schema.Properties).forEach((propname) => {
      const propSchema = schema.Properties[propname].Schema()
      const type = propSchema.Type[0]
      const ref = getRef(propSchema)

      if (!ref && (type != "number" && type != "string" && type != "integer" && type != "boolean")) {
        console.log("WARN: not supported nested structure found", tablename, propname, type)
      }

      if (!ref) {
        ctx.tables[tablename][propname] = {type: type}
      }

      if (ref) {
        ctx.rels.push({kind: "object-ref", fromname: propname, from: tablename, to: _toSnake(ref[0])})
      }
    })
  }

  if (schema.Type == "array") {
    const tablename = _toSnake(name)
    ctx.tables[tablename] = {"_rels": {}, id: {type: "number"}}
  }
  // enum string
  //  add table
  // object
  //  loop props
  //  add table
  //  add rels
  // array
  //  add table
  //
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

var data = file("object.yaml")
// assert(err)
// console.log(data[0])
var [doc, err] = openapischema(data)
assert(err, [])
var result = docToTables(doc)
assert(result)

tablesToSQL(result.tables)

