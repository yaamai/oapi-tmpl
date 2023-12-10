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
  style = NewStyle(book, {Indent: level})
  book.SetCellStyle(sheet, coord, coord, style)
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
function makeInterfaceDescription(doc, pathname, method) {
  if (!doc.Model.Paths.PathItems[pathname]) return []
  if (!doc.Model.Paths.PathItems[pathname][method]) return []

  const operation = doc.Model.Paths.PathItems[pathname][method];
  if (!operation.Responses.Codes[200]) return []
  if (!operation.Responses.Codes[200].Content["application/json"]) return []

  const schema = operation.Responses.Codes[200].Content["application/json"].Schema.Schema()
  return schemaToRows(schema, 1, "", -1, [])
}

function schemaToRows(schema, index, name, indent, required) {
  if (schema.Type == "object") {
    var output = []
    Object.keys(schema.Properties).forEach(function (propname, i) {
      rows = schemaToRows(schema.Properties[propname].Schema(), index+i, propname, indent+1, schema.Required)
      output = output.concat(rows)
    })
    return output
  } else if (schema.Type == "array") {
    var output = []
    output.push([index, indent, name, schema.Type[0], true, required.includes(name), schema.Description])
    var rows = schemaToRows(schema.Items.A.Schema(), index+1, "", indent, required)
    output = output.concat(rows)
    return output
  } else {
    return [[index, indent, name, schema.Type[0], false, required.includes(name), schema.Description]]
  }
}

function main(doc, book) {

  makeInterfaceList(doc).forEach((vals) => {
    // output interface list
    var pos = ["B4", "C4", "D4", "E4", "F4", "G4"]
    sets(book, "List", pos, vals)
    pos = offsets(pos, 1, 1)

    // create interface response sheet
    templateSheetName = "Template"
    sheetName = "Resp("+vals[1]+")"

    destIndex = book.NewSheet(sheetName)
    sourceIndex = book.GetSheetIndex(templateSheetName)
    book.CopySheet(sourceIndex, destIndex)

    // output interface detail
    var pos = ["B4", "C4", "D4", "E4", "F4"]
    makeInterfaceDescription(doc, vals[2], vals[4]).forEach((vals) => {
      sets(book, sheetName, pos, [vals[0], vals[2], vals[4], vals[5], vals[6]])
      indent(book, sheetName, pos[1], vals[1])
      pos = offsets(pos, 1, 1)
    })
  })

}

// below arguments pass by the golang host program
main(OpenApiDocument, OutputBook)
