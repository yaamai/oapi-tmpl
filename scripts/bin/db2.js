const utils = require('./scripts/utils.js')
const schemas = require('./scripts/schema.js')

var data = file("if.yaml")
// assert(err)
// console.log(data[0])
var [doc, err] = openapischema(data)
utils.assert(err, [])
var result = schemas.docToTables(doc)
utils.assert(result)

// tablesToSQL(result.tables)

var book = excelfile("data.base.xlsm")
tablesToExcel(book, result.tables)
book.SaveAs("data.xlsm")

