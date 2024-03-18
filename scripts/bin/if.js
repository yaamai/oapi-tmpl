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

function removeEmptyLineAndSetPrintArea(book, sheet) {
  // console.log(sheet)

  // search property end
  var pos = ["C8"]
  while(true) {
    let val = book.GetCellValue(sheet, pos[0])
    // console.log(val)
    if (!val) {
      break
    }
    pos = excel.offsets(pos, 1, 1)
  }

  // remove rows
  while(true) {
    let checkTargetPos = excel.offsets(pos, 1, 2)
    let val = book.GetCellValue(sheet, checkTargetPos[0])
    // console.log(pos, val)
    if (val != "") {
      var col, row
  		[col, row] = excelize.cellNameToCoordinates(pos[0])
      // console.log(pos, col, row)
      excelize.removeRow(book, sheet, row)
    } else {
      break
    }
  }

  // set print area
  let printAreaEndPos = excel.offsets(pos, 1, 4)
  let colPos = printAreaEndPos.toString().match("([A-Z]+)([0-9]+)")
  let area = sheet + "!$C$1:" + "$"+"CB"+"$"+colPos[2]
  console.log(area)
  excelize.setPrintArea(book, "Print_Area", sheet, area)
}

var book = excelfile(args()[1])

const filedata = file(args()[0])
var [doc, err] = openapischema(filedata)
utils.assert(err, [])

const ifList = makeInterfaceList(doc)
fill(book, "list", ["C7", "E7", "U7", "AL7", "AW7", "BF7"], ifList, (r) => r, null, null)

for(let [method, pathname, oper] of oapi.iterOperations(doc)) {
  console.log(pathname, method, oper)
  // if(!(method == "Get" && pathname == "/v1/a")) continue

  const pos = ["C8", "E8", "AN8", "AR8", "AV8"]
  const f = (r,idx) => [idx+1, r.name, r.repeated, "TRUE", r.desc]
  const [pathParameter, reqSchema, respSchema] = oapi.getOperationSchemas(oper)
  if(reqSchema) {
    reqSchemaTable = oapi.flatten(oapi.getJaName(reqSchema), [], reqSchema, 0, false)
    console.log(JSON.stringify(reqSchemaTable, null, "  "))
    let dest = fill(book, "template", pos, reqSchemaTable, f, (r,p,idx) => [p[1], r.indent], "REQ_"+method+"_"+oper.Summary)
    excel.sets(book, dest, ["AS5"], [oper.OperationId])
    excel.sets(book, dest, ["L5"], [oper.Summary])
    removeEmptyLineAndSetPrintArea(book, dest)
    // excel.sets(book, dest, ["L5"], [oper.Summary])
  }
  if(respSchema) {
    respSchemaTable = oapi.flatten(oapi.getJaName(respSchema), [], respSchema, 0, false)
    console.log(JSON.stringify(respSchemaTable, null, "  "))
    let dest = fill(book, "template", pos, respSchemaTable, f, (r,p,idx) => [p[1], r.indent], "RES_"+method+"_"+oper.Summary)
    excel.sets(book, dest, ["AS5"], [oper.OperationId])
    excel.sets(book, dest, ["L5"], [oper.Summary])

    removeEmptyLineAndSetPrintArea(book, dest)
    // excel.sets(book, dest, ["L5"], [oper.Summary])
  }
}
book.DeleteSheet("template")

book.SaveAs(args()[2])
