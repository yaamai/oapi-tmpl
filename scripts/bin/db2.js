const utils = require('./scripts/utils.js')
const schema = require('./scripts/schema.js')

var data = file(args()[0])
var [doc, err] = openapischema(data)
utils.assert(err, [])

var ctx = new schema.Context()
for(let [name, s] of schema.iterSchemas(doc)) {
  schema.schemaToTable(ctx, name, s)
}

var book = excelfile(args()[1])
schema.tablesToExcel(ctx, book, "一覧")
book.SaveAs(args()[2])

