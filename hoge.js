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

function assert(a, b) {
  if (deepCompare(a, b)) {
    console.log("OK")
  } else {
    console.log("FAIL")
    console.log(JSON.stringify(a))
    console.log(JSON.stringify(b))
  }
}

function schemaToTable(schema, name) {
  var result = {}
  result[name] = {}
  Object.keys(schema.Properties).forEach((prop) => {
    var propSchema = schema.Properties[prop].Schema()

    // make enum string to master table
    if (propSchema.Enum.length > 0) {
      result[prop] = {id: {type: "number"}, value: {"type": "string"}}
      result[name][prop] = {type: "number", foreign: prop}
      return
    }

    // make 1:N association
    if (propSchema.Type == "array") {
      const subPropSchema = propSchema.Items.A.Schema()

      // non-nested type are represented in simple association table
      var assocTableName = name+"_"+prop+"_assoc"
      if (subPropSchema.Type == "string" || subPropSchema.Type == "number") {
        result[assocTableName] = {id: {type: "number", foreign: name}, value: {"type": "string"}}
      } else {
        var table = schemaToTable(subPropSchema, assocTableName)
        table[assocTableName]["id"] = {type: "number", foreign: name}
        result[assocTableName] = table[assocTableName]
      }
      return
    }

    // otherwise normal column
    result[name][prop] = {type: propSchema.Type[0]}
  })
  return result
}

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: number
`)
var b = {"test":{"bbb":{"type":"number"},"aaa":{"type":"string"}}}
assert(schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: string
    enum:
    - a
    - b
`)
var b = {"test":{"bbb":{"type":"number","foreign":"bbb"},"aaa":{"type":"string"}},"bbb":{"id":{"type":"number"},"value":{"type":"string"}}}
assert(schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: array
    items:
      type: string
`)
var b = {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"id":{"type":"number","foreign":"test"},"value":{"type":"string"}}}
assert(schemaToTable(a, "test"), b)

// 2024/01/30 00:59:34 {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"ccc":{"type":"object"},"id":{"type":"number","foreign":"test"}}}

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: array
    items:
      type: object
      properties:
        ccc:
          type: string
`)
var b = {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"ccc":{"type":"string"},"id":{"type":"number","foreign":"test"}}}
assert(schemaToTable(a, "test"), b)

/*
var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: array
    items:
      type: object
      properties:
        ccc:
          type: object
          properties:
            ddd:
              type: number
`)
// {aaa: "", bbb: [{ccc: {ddd: 123}}]}
var b = {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"ccc":{"type":"string"},"id":{"type":"number","foreign":"test"}}}
assert(schemaToTable(a, "test"), b)
*/
