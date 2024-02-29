const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')

var data = file(args()[0])
var [doc, err] = openapischema(data)
utils.assert(err, [])

var name = "Result"
let converter = new db.OAPIToDBConverter(name, doc.Model.Components.Schemas[name].Schema())
converter.process()
for(let tableName of Object.keys(converter.result)) {
  print(`table ${tableName} {\n`)
  for(let colName of Object.keys(converter.result[tableName].columns)) {
    let column = converter.result[tableName].columns[colName]
    print(`  ${column.name} ${column.type}\n`)
  }
  print(`}\n`)

  for(let colName of Object.keys(converter.result[tableName].columns)) {
    let foreign = converter.result[tableName].columns[colName].foreign
    if (!foreign) continue

    print(`Ref: ${tableName}.${foreign.keyname} - ${foreign.tablename}.id\n`)
  }
}
// const schemas = doc.Model.Components.Schemas
// Object.keys(schemas).forEach((name) => {
//   const schema = schemas[name].Schema()
//   let converter = new db.OAPIToDBConverter(name, schema)
//   converter.process()
//   converter.result
// })
