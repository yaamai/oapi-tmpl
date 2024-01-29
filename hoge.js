function assert(a, b) {
  JSON.stringify(a) === JSON.stringify(b)
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
console.log(JSON.stringify(schemaToTable(a, "test")))

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

console.log(JSON.stringify(schemaToTable(a, "test")))

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

console.log(JSON.stringify(schemaToTable(a, "test")))

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

console.log(JSON.stringify(schemaToTable(a, "test")))

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

console.log(JSON.stringify(schemaToTable(a, "test")))
