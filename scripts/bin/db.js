const utils = require('./scripts/utils.js')
const db = require('./scripts/db.js')
const excel = require('./scripts/excel.js')
const oapi = require('./scripts/oapi.js')

function main() {
  var data = file(args()[0])
  var [doc, err] = openapischema(data)
  utils.assert(err, [])

  var book = excelfile(args()[1])

  // dummy(doc)
  for(let [method, pathname, oper] of oapi.iterOperations(doc)) {
    const [pathParameter, reqSchema, respSchema] = oapi.getOperationSchemas(oper)

    let converter = null

    if (reqSchema) {
      const reqSchemaName = oapi.getRefName(reqSchema)
      console.log(reqSchemaName)
      converter = new db.OAPIToDBConverter(reqSchemaName, reqSchema)
      converter.process()
      console.log(JSON.stringify(converter.result, null, "  "))
      tablesToExcel(book, converter.result)
    }

    if (respSchema) {
      const respSchemaName = oapi.getRefName(respSchema)
      console.log(respSchemaName)
      converter = new db.OAPIToDBConverter(respSchemaName, respSchema)
      converter.process()
      console.log(JSON.stringify(converter.result, null, "  "))
      tablesToExcel(book, converter.result)
    }
  }

  book.SaveAs(args()[2])
}

function dummy(doc) {
  var name = "Result"
  let converter = new db.OAPIToDBConverter(name, doc.Model.Components.Schemas[name].Schema())
  converter.process()

  toDBML(converter.result)
}

function tablesToDBML(tables) {
  for(let tableName of Object.keys(tables)) {
    print(`table ${tableName} {\n`)
    for(let colName of Object.keys(tables[tableName].columns)) {
      let column = tables[tableName].columns[colName]
      print(`  ${column.name} ${column.type}\n`)
    }
    print(`}\n`)
  
    for(let colName of Object.keys(tables[tableName].columns)) {
      let foreign = tables[tableName].columns[colName].foreign
      if (!foreign) continue
  
      print(`Ref: ${tableName}.${foreign.keyname} - ${foreign.tablename}.id\n`)
    }
  }
}

// const schemas = doc.Model.Components.Schemas
// Object.keys(schemas).forEach((name) => {
//   const schema = schemas[name].Schema()
//   let converter = new db.OAPIToDBConverter(name, schema)
//   converter.process()
//   converter.result
// })

function safeSheetName(name) {
  let sheetName = name
  if (!sheetName) return null

  // if multiline, take first line
  if (name.split("\n").length > 0) {
    name = name.split("\n")[0]
  }

  // slice to satisfy sheet name limit
  sheetName = sheetName.slice(0, 20)

  // remove unusable chars
  sheetName = sheetName.replace("/", "")

  return sheetName
}

function tablesToExcel(book, tables) {
  for(let [index, tableName] of Object.keys(tables).sort().entries()) {
    console.log("create", tableName, "sheet")
    let sheetName = safeSheetName(tables[tableName].altname)
    if (!sheetName) {
      console.log("WARN: ", sheetName, JSON.stringify(tables[tableName]))
      continue
    }
    excel.dup(book, "template", sheetName)

    let pos = ["F8", "Q8", "AB8", "AK8", "AU8"]
    for(let colName of Object.keys(tables[tableName].columns)) {
      console.log(colName)
      const col = tables[tableName]["columns"][colName]
      excel.sets(book, sheetName, pos, [col.altname, col.name, col.type, "", col.desc])
      pos = excel.offsets(pos, 1, 1)
    }
  }
}

main()