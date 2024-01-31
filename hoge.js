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

function assert(m, a, b) {
  if (deepCompare(a, b)) {
    console.log("TEST: " + m.padEnd(32) + ": OK")
  } else {
    console.log("TEST: " + m.padEnd(32) + ": FAIL")
    console.log(JSON.stringify(a))
    console.log(JSON.stringify(b))
  }
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

function schemaToTables(name, schema, tables, rels) {
  if (schema.Type == "object") {
    tables[name] = {}
    Object.keys(schema.Properties).forEach((propname) => {
      const propSchema = schema.Properties[propname].Schema()
      const type = propSchema.Type[0]
      const ref = getRef(propSchema)

      if (!ref) {
        tables[name][propname] = {type: type}
      }

      if (ref) {
        rels.push({parent: name, child: ref[0]})
      }
    })
    return
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


function extractTableSchema(doc) {
  var tables = []
  var relations = []

  const schemas = doc.Model.Components.Schemas
  Object.keys(schemas).forEach((name) => {
    const schema = schemas[name].Schema()
    schemaToTables(name, schema, tables, relations)

    /*
    if (schema.Type[0] == "object") {
      var table = {}
      Object.keys(schema.Properties).forEach((propname) => {
        const propSchema = schema.Properties[propname].Schema()
        const type = propSchema.Type[0]
        table[propname] = {type: type}
      })
      assert("", table)
    }
    assert("", )
    */
  })
  console.log()
}

a = `
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
`
var [s, err] = openapischema(a)
assert("", err, [])
assert("", extractTableSchema(s), {})


a = `
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
          $ref: "#/components/schemas/Bbb"
    Bbb:
      type: object
      properties:
        bbb:
          type: string
    
`
var [s, err] = openapischema(a)
assert("", err, [])
assert("", extractTableSchema(s), {})

a = `
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
          - description: aaa
          - $ref: "#/components/schemas/Bbb"
    Bbb:
      type: object
      properties:
        bbb:
          type: string
    
`
var [s, err] = openapischema(a)
assert("object has allOf refs", err, [])
assert("object has allOf refs", extractTableSchema(s), {})
