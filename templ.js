const methods = ["Get", "Post", "Delete", "Patch", "Put"]

// output interface list
// exampls:
// | No. | IFName(ja) | IFName(en) | Dest. Service | Method |
// | 1   | hogehoge | /hogehoge | Hoge service | GET |
function makeInterfaceList(doc) {
  const paths = doc.Model.Paths.PathItems;

  var idx = 1
  var output = []
  Object.keys(paths).forEach(function (pathname) {
    methods.forEach(function (method) {
      if (!paths[pathname][method]) {
        return
      }
  
      vals = [idx, paths[pathname][method].Summary, pathname, "", method]
      idx++
      output.push(vals)
    })
  })

  return output
}

// output interface request/response
// exampls:
// | No. | property | repeat | required | description                    |
// | 1   | id       | x      | o        | indentifier of hogehoge object |
// | 2   | foo      | x      | o        | indentifier of hogehoge object |
// | 3   |  foo     | o      | o        | indentifier of hogehoge object |
//
// array in array([[]]): not supported
// object in array([{}]): not supported
// array in object({[]}): support
// object in object({{}}): support
// currently only 200 response and json data are supported
function makeInterfaceDescription(doc, pathname, method) {
  if (!doc.Model.Paths.PathItems[pathname]) return
  if (!doc.Model.Paths.PathItems[pathname][method]) return

  const operation = doc.Model.Paths.PathItems[pathname][method];
  if (!operation.Responses.Codes[200]) return
  if (!operation.Responses.Codes[200].Content["application/json"]) return

  const schema = operation.Responses.Codes[200].Content["application/json"].Schema.Schema()

  function inner(schema, index, name, indent, required) {
    if (schema.Type == "object") {
      var output = []
      Object.keys(schema.Properties).forEach(function (propname, i) {
        rows = inner(schema.Properties[propname].Schema(), index+i, propname, indent+1, schema.Required)
        output = output.concat(rows)
      })
      return output
    } else if (schema.Type == "array") {
      var output = []
      output.push([index, indent, name, schema.Type[0], true, required.includes(name), schema.Description])
      var rows = inner(schema.Items.A.Schema(), index+1, "", indent, required)
      output = output.concat(rows)
      return output
    } else {
      return [[index, indent, name, schema.Type[0], false, required.includes(name), schema.Description]]
    }
  }

  return inner(schema, 1, "", 0, [])
}

function main(doc) {
  var pos = ["A2", "B2", "C2", "D2", "E2"]
  var offset = 1

  makeInterfaceList(doc).forEach((vals) => {
    // set("Sheet", pos, vals)
    // pos = offsets(pos, 1, 1)
    console.log(vals)
    var output = makeInterfaceDescription(doc, vals[2], vals[4])
    console.log(JSON.stringify(output))
  })

}



main(doc)
console.log("finished");
// console.log(Object.keys(doc))
// console.log(Object.keys(doc.Model))
// console.log(Object.keys(doc.Model.Paths))
// console.log(Object.keys(doc.Model.Paths.PathItems["/pets"]))
// console.log(doc.Model.Paths.PathItems["/pets"].Get.Summary)
// console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get))
// console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.BuildSchema().Properties))
// console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema()))
// console.log(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema().Type)
// console.log(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema().Items[0].Schema().Properties)
// console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema().Items.A.Schema().Properties))


// var pos = ["B2", "E2", "I2"]
// set("シート1", pos, ["1", "2", "33"])
// set("Sheet1", pos, ["1", "2", "33"])
//  .Model.Paths.PathItems.length);
