var data = file("if.yaml")
// assert(err)
// console.log(data[0])
var [doc, err] = openapischema(data)
assert(err, [])
var result = docToTables(doc)
assert(result)

tablesToSQL(result.tables)

var book = excelfile("data.base.xlsm")
tablesToExcel(book, result.tables)
book.SaveAs("data.xlsm")

