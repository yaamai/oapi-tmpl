const utils = require('./scripts/utils.js')
const oapi = require('./scripts/oapi.js')
const excel = require('./scripts/excel.js')

// output interface list
// exampls:
// | No. | IFName(ja) | IFName(en) | Dest. Service | Method | Description |
// | 1   | hogehoge   | /hogehoge  | Hoge service  | GET    | hogehoge    |
function makeInterfaceList(doc) {
  const methods = ["Get", "Post", "Delete", "Patch", "Put"]
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

function* iterOperations(doc) {
  const methods = ["Get", "Post", "Delete", "Patch", "Put"]
  const paths = doc.Model.Paths.PathItems;

  for(let pathname of Object.keys(paths)) {
    for(let method of methods) {
      if(!paths[pathname][method]) {
        continue
      }
      yield [method, pathname, paths[pathname][method]]
    }
  }
}

function getOperationSchemas(operation) {
  var respSchema, reqSchema, pathParameter

  var code = Object.keys(operation.Responses.Codes)[0]
  if (operation.Responses.Codes[code] && operation.Responses.Codes[code].Content["application/json"]) {
    respSchema = operation.Responses.Codes[code].Content["application/json"].Schema.Schema()
  }

  if (operation && operation.Parameters.length > 0) {
    pathParameter = operation.Parameters
  }

  if (operation.RequestBody) {
    reqSchema = operation.RequestBody.Content["application/json"].Schema.Schema()
  }

  return [pathParameter, reqSchema, respSchema]
}

function fill(book, sheetname, basePos, table, func, funcIndent, newSheetname) {
  // create destination sheet
  var dest = sheetname
  if (newSheetname) {
    newSheetname = newSheetname.slice(0, 20)
    excel.dup(book, sheetname, newSheetname)
    dest = newSheetname
  }

  var idx = 0
  var pos = basePos
  for(let row of table) {
    let vals = func(row, idx)
    excel.sets(book, dest, pos, vals)

    if (funcIndent) {
      let [indentPos, indentLevel] = funcIndent(row, pos, idx)
      excel.indent(book, dest, indentPos, indentLevel)
    }

    pos = excel.offsets(pos, 1, 1)
    idx++
  }
  return dest
}

var book = excelfile("if.xlsm")

const filedata = file("if.yaml")
var [doc, err] = openapischema(filedata)
utils.assert(err, [])

const ifList = makeInterfaceList(doc)
fill(book, "list", ["C7", "E7", "U7", "AL7", "AW7", "BF7"], ifList, (r) => r, null, null)

for(let [method, pathname, oper] of iterOperations(doc)) {
  console.log(pathname, method, oper)
  // if(pathname != "/v1/situation_analyzes") continue

  const pos = ["C8", "E8", "AN8", "AR8", "AV8"]
  const f = (r,idx) => [idx+1, r.name, r.repeated, r.required, r.desc]
  const [pathParameter, reqSchema, respSchema] = getOperationSchemas(oper)
  if(reqSchema) {
    reqSchemaTable = oapi.flatten(oapi.getJaName(reqSchema), [], reqSchema, 0, false)
    // console.log(JSON.stringify(reqSchemaTable, null, "  "))
    let dest = fill(book, "template", pos, reqSchemaTable, f, (r,p,idx) => [p[1], r.indent], "REQ_"+oper.Summary)
    excel.sets(book, dest, ["AS5"], [oper.OperationId])
  }
  if(respSchema) {
    respSchemaTable = oapi.flatten(oapi.getJaName(respSchema), [], respSchema, 0, false)
    let dest = fill(book, "template", pos, respSchemaTable, f, (r,p,idx) => [p[1], r.indent], "RES_"+oper.Summary)
    excel.sets(book, dest, ["AS5"], [oper.OperationId])
  }

}

book.SaveAs("if_20240220.xlsm")