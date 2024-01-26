const methods = ["Get", "Post", "Delete", "Patch", "Put"]

// set cell values
function sets(book, sheet, coords, vals) {
  coords.forEach((c, idx) => {
    const err = book.SetCellValue(sheet, c, vals[idx])
    if (err) {
      console.log(err)
    }
  })
}

// calc cell address by offset
function offsets(coords, axis, offset) {
  return coords.map((c) => {
    var err, col, row, coord
		[col, row] = CellNameToCoordinates(c)

    if (axis == 0) {
			return CoordinatesToCellName(col+offset, row)
    } else {
			return CoordinatesToCellName(col, row+offset)
    }
  })
}

// set cell indent
function indent(book, sheet, coord, level) {
  style = NewStyleFromCell(book, sheet, coord, {Indent: level})
  book.SetCellStyle(sheet, coord, coord, style)
}

function dup(book, templateSheetName, sheetName) {

    destIndex = book.NewSheet(sheetName)
    sourceIndex = book.GetSheetIndex(templateSheetName)
    book.CopySheet(sourceIndex, destIndex)
}

// output interface list
// exampls:
// | No. | IFName(ja) | IFName(en) | Dest. Service | Method | Description |
// | 1   | hogehoge   | /hogehoge  | Hoge service  | GET    | hogehoge    |
function makeInterfaceList(doc) {
  const paths = doc.Model.Paths.PathItems;

  var idx = 1
  var output = []
  Object.keys(paths).forEach(function (pathname) {
    methods.forEach(function (method) {
      if (!paths[pathname][method]) {
        return
      }
  
      vals = [idx, paths[pathname][method].Summary, pathname, "", method, paths[pathname][method].Description]
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
function makeInterfaceResponseDescription(doc, pathname, method) {
  if (!doc.Model.Paths.PathItems[pathname]) return []
  if (!doc.Model.Paths.PathItems[pathname][method]) return []

  const operation = doc.Model.Paths.PathItems[pathname][method];
  if (!operation.Responses.Codes[200]) return []
  if (!operation.Responses.Codes[200].Content["application/json"]) return []

  const schema = operation.Responses.Codes[200].Content["application/json"].Schema.Schema()
  return schemaToRows(schema, "", -1, [])
}

function makeInterfaceRequestDescription(doc, pathname, method) {
  const pathItem = doc.Model.Paths.PathItems[pathname]
  if (!pathItem) return []
  if (!pathItem[method]) return []

  if (pathItem.Parameters.length > 0) {
    return pathParametersToList(pathItem.Parameters)
  }

  const operation = doc.Model.Paths.PathItems[pathname][method];
  if (!operation.RequestBody) return []
  if (!operation.RequestBody.Content) return []
  if (!operation.RequestBody.Content["application/json"]) return []

  const schema = operation.RequestBody.Content["application/json"].Schema.Schema()
  return schemaToRows(schema, "", -1, [])
}

function pathParametersToList(parameters) {
  return parameters.map((p) => {
    const schema = p.Schema.Schema()
    var name = p.Name
    console.log(Object.keys(schema))
    if (schema.Extensions["x-janame"]) {
      name = schema.Extensions["x-janame"]
    }
    return [0, name, schema.Type, false, p.Required, p.Description]
  })
}

function schemaToRows(schema, name, indent, required) {
  console.log("type:", (schema.Type || "") + (schema.AllOf.length > 0?"allOf":""))

  if (schema.AllOf.length > 0) {
    var output = []
    schema.AllOf.forEach(function (sub) {
      var rows = schemaToRows(sub.Schema(), name, indent, required)
      output = output.concat(rows)
    })
    return output
  }

  if (schema.Type == "object") {
    var output = []
    if (name) {
      output.push([indent, schema.Extensions["x-janame"] || name, schema.Type[0], false, required.includes(name), schema.Description])
    }
    Object.keys(schema.Properties).forEach(function (propname, i) {
      rows = schemaToRows(schema.Properties[propname].Schema(), propname, indent+1, schema.Required)
      output = output.concat(rows)
    })
    return output
  } else if (schema.Type == "array") {
    var output = []
    if (schema.Extensions["x-janame"]) {
      name = schema.Extensions["x-janame"]
    }
    output.push([indent, name, schema.Type[0], true, required.includes(name), schema.Description])

    var rows = schemaToRows(schema.Items.A.Schema(), "", indent, required)
    output = output.concat(rows)
    return output
  } else {
    if (schema.Extensions["x-janame"]) {
      name = schema.Extensions["x-janame"]
    }
    return [[indent, name, schema.Type[0], false, required.includes(name), schema.Description]]
  }
}

function outputInterfaceResponseDescription(book, doc, vals) {
  // create interface response sheet
  templateSheetName = "template"
  sheetName = "Resp("+vals[1]+")"
  sheetName = sheetName.slice(0, 20)
  dup(book, templateSheetName, sheetName)

  // output interface detail
  var pos = ["C8", "E8", "AN8", "AR8", "AV8"]
  makeInterfaceResponseDescription(doc, vals[2], vals[4]).forEach((vals, i) => {
    console.log("PROP:", vals)
    sets(book, sheetName, pos, [i, vals[1], vals[3], vals[4], vals[5]])
    indent(book, sheetName, pos[1], vals[0])
    pos = offsets(pos, 1, 1)
  })
}

function outputInterfaceRequestDescription(book, doc, vals) {
  // create interface request sheet
  templateSheetName = "template"
  sheetName = "Req("+vals[1]+")"
  sheetName = sheetName.slice(0, 20)
  dup(book, templateSheetName, sheetName)

  // output interface detail
  var pos = ["C8", "E8", "AN8", "AR8", "AV8"]
  makeInterfaceRequestDescription(doc, vals[2], vals[4]).forEach((vals, i) => {
    console.log("PROP:", vals)
    sets(book, sheetName, pos, [i, vals[1], vals[3], vals[4], vals[5]])
    indent(book, sheetName, pos[1], vals[0])
    pos = offsets(pos, 1, 1)
  })
}

function main(doc, book) {

  // output interface list
  var pos = ["C7", "E7", "U7", "AL7", "AW7", "BF7"]
  makeInterfaceList(doc).forEach((vals) => {
    sets(book, "list", pos, vals)
    pos = offsets(pos, 1, 1)
    console.log("WRITE LIST:", vals)

    outputInterfaceResponseDescription(book, doc, vals)
    outputInterfaceRequestDescription(book, doc, vals)
  })

}

// below arguments pass by the golang host program
main(OpenApiDocument, OutputBook)
