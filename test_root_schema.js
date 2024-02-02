const utils = require('./utils.js')
let doctext = `
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
        foo:
          $ref: "#/components/schemas/Foo"
    Foo:
      type: object
      properties:
        aaa:
          $ref: "#/components/schemas/Aaa"
    Aaa:
      type: object
      properties:
        bbb:
          type: string
    Bbb:
      allOf:
      - $ref: "#/components/schemas/Ccc"
      - $ref: "#/components/schemas/Ddd"
    Ccc:
      type: object
      properties:
        ccc:
          type: string
    Ddd:
      type: object
      properties:
        ddd:
          oneOf:
          - $ref: "#/components/schemas/Eee"
          - $ref: "#/components/schemas/Fff"
    Eee:
      type: object
    Fff:
      type: object
    Ggg:
      type: array
      items:
        $ref: "#/components/schemas/Bbb"
`

var [doc, err] = openapischema(doctext)
utils.assert(err, [])

function traverse(name, schema, pre, func) {
  // console.log(name, schema.Type, schema.AllOf.length > 0, schema.OneOf.lenght > 0)
  if (pre) pre(schema)
  if(schema.Type == "object") {
    for(let propname of Object.keys(schema.Properties)) {
      traverse(propname, schema.Properties[propname].Schema(), pre, func)
    }
  } else if(schema.Type == "array") {
    traverse("[]", schema.Items.A.Schema(), pre, func)
  } else if(schema.AllOf.length > 0) {
    for(let subSchema of schema.AllOf) {
      traverse("*", subSchema.Schema(), pre, func)
    }
  } else if(schema.OneOf.length > 0) {
    for(let subSchema of schema.OneOf) {
      traverse("|", subSchema.Schema(), pre, func)
    }
  } else {
    if(func) func(schema)
  }
}

// traverse("Bbb", doc.Model.Components.Schemas["Bbb"].Schema(), (schema) => {
//   console.log(schema.ParentProxy.GetReference())
// })

var counter = {}
Object.keys(doc.Model.Components.Schemas).forEach(n => counter[n] = 0)
for(let name of Object.keys(doc.Model.Components.Schemas)) {
  traverse(name, doc.Model.Components.Schemas[name].Schema(), (schema) => {
    var refname = schema.ParentProxy.GetReference()
    if (refname) {
      refname = refname.match(/[^\/]+$/)[0]
      if (!counter[refname]) {
        counter[refname] = 0
      }
      counter[refname] += 1
    }
    console.log(schema.ParentProxy.GetReference())
  })
}
console.log(JSON.stringify(counter))
