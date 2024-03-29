const utils = require('./utils.js')
const oapi = require('./oapi.js')
const excel = require('./excel.js')

const ALTNAME_ID = "識別子"
const ALTNAME_VALUE = "値"
const ALTNAME_RELTABLE = "関連付けテーブル"

class Context {
  constructor() {
    this.tables = {}
  }

  ensureTable(name, altname) {
    if (this.tables.hasOwnProperty(name)) {
      return this.tables[name]
    } else {
      const table = new Table(name, altname)
      this.tables[table.name] = table
      return table
    }
  }
}

class Table {
  constructor(name, altname) {
    this.name = name
    this.altname = altname
    this.columns = {}
  }

  addColumn(column) {
    this.columns[column.name] = column
  }
}

class Column {
  constructor(name, altname, type, foreign) {
    this.name = name
    this.altname = altname
    this.type = type
    this.foreign = foreign
  }
}

class Foreign {
  // FOREIGN KEY(<keyname>) REFERENCES <tablename>(id)
  constructor(keyname, tablename, refname) {
    this.keyname = keyname
    this.tablename = tablename
    this.refname = refname
  }
}


function* iterSchemas(doc) {
  const schemas = doc.Model.Components.Schemas
  for(let name of Object.keys(schemas)) {
    yield [name, schemas[name].Schema()]
  }
}

function* iterProps(schema) {
  for(let propName of Object.keys(schema.Properties)) {
    const propSchema = schema.Properties[propName].Schema()
    const type = propSchema.Type[0]

    yield [propName, type, propSchema]
  }
}

function getRef(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)[0]
}

function arraySchemaToTable(ctx, name, schema) {
  // table name are commonly plural form
  let tablename = utils.toSnake(name) + "s"
  let tablenameJa = oapi.getJaName(schema) || name
  let table = ctx.ensureTable(tablename, tablenameJa)

  // primitive types are added to column with fixed column name and fixed id (array can't have id in jsonschema)
  let subSchema = schema.Items.A.Schema()
  let subType = subSchema.Type[0]

  // console.log(name, subType)
  if(["number", "string", "integer", "boolean"].includes(subType)) {
    table.addColumn(new Column("id", ALTNAME_ID, "number", null))
    table.addColumn(new Column("value", ALTNAME_VALUE, subType, null))
    return
  }

  let isRef = subSchema.ParentProxy.IsReference()
  if(subType == "object" && !isRef) console.warn("WARN: can't determine relation target")

  // when object ref in array, create relation table and add foreign key to array's table
  if((subType == "object" || subType == "array") && isRef) {
    let refname = getRef(subSchema)
    let refnameJa = oapi.getJaName(subSchema) || refname
    let refpropname = utils.toSnake(refname)
    let reftablename = refpropname + "s"

    table.addColumn(new Column("id", ALTNAME_ID, "number", null))
    let relTable = ctx.ensureTable(tablename + "_" + reftablename, ALTNAME_RELTABLE+"("+tablename+"-"+reftablename+")")
    relTable.addColumn(new Column(tablename+"_id", tablenameJa+ALTNAME_ID, "number", new Foreign(tablename+"_id", tablename, name)))
    relTable.addColumn(new Column(refpropname+"_id", refnameJa+ALTNAME_ID, "number", new Foreign(refpropname+"_id", reftablename, refname)))

    return
  }

  console.log("        ######## WARN")
}

function objectSchemaToTable(ctx, name, schema) {
  // table name are commonly plural form
  const tablename = utils.toSnake(name) + "s"
  const tablenameJa = oapi.getJaName(schema) || name

  if (Object.keys(schema.Properties).length == 0) {
    console.log("#############################")
    return
  }

  let table = ctx.ensureTable(tablename, tablenameJa)

  for(let [propName, propType, propSchema] of iterProps(schema)) {
    // console.log(propName, propType, propSchema)

    // primitive types are always added to column
    if(["number", "string", "integer", "boolean"].includes(propType)) {
      table.addColumn(new Column(propName, oapi.getJaName(propSchema) || propName, propType, null))
      continue
    }

    // when object's property has object or allOf object, create column and 1:1 relation
    // similary rules apply when object's property has array or allOf array, create column and 1:1 relation
    let isRef = propSchema.ParentProxy.IsReference()
    let isAllOf = propSchema.AllOf.length > 0
    let allOfObjectSchemas = propSchema.AllOf.filter(s => s.Schema().ParentProxy.IsReference() && s.Schema().Type == "object")
    let allOfArraySchemas = propSchema.AllOf.filter(s => s.Schema().ParentProxy.IsReference() && s.Schema().Type == "array")

    let propAltName = oapi.getJaName(propSchema) || propName
    if (isAllOf) {
      let allJaNames = propSchema.AllOf.map(s => oapi.getJaName(s.Schema())).filter(n => n)
      propAltName = allJaNames[allJaNames.length-1]
    }

    if(propType == "object" && !isRef) console.warn("WARN: can't determine relation target")
    if(isAllOf && allOfObjectSchemas.length > 1) console.warn("WARN: can't determine relation target")

    if(propType == "object" && isRef) {
      let refname = getRef(propSchema)
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, propAltName, "number", new Foreign(propName, tablename, refname)))
      continue
    }

    if(isAllOf && allOfObjectSchemas.length == 1) {
      let refname = getRef(allOfObjectSchemas[0].Schema())
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, propAltName, "number", new Foreign(propName, tablename, refname)))
      continue
    }

    if(propType == "array" && isRef) {
      let refname = getRef(propSchema)
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, propAltName, "number", new Foreign(propName, tablename, refname)))
      continue
    }

    if(propType == "array" && !isRef) {
      console.log(JSON.stringify(propSchema.Items.A.Schema()))
      let refname = getRef(propSchema.Items.A.Schema())
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, propAltName, "number", new Foreign(propName, tablename, refname)))
      continue
    }

    if(isAllOf && allOfArraySchemas.length == 1) {
      let refname = getRef(allOfArraySchemas[0].Schema())
      let tablename = utils.toSnake(refname) + "s"
      table.addColumn(new Column(propName, propAltName, "number", new Foreign(propName, tablename, refname)))
      continue
    }

    // console.log("        ######## WARN")
  }
}

function schemaToTable(ctx, name, schema) {
  // console.log(name, schema.Type)
  if (schema.Type == "object") objectSchemaToTable(ctx, name, schema)
  if (schema.Type == "array") arraySchemaToTable(ctx, name, schema)
  if (schema.AllOf.length > 0) {
    for(let subSchema of schema.AllOf) {
      schemaToTable(ctx, name, subSchema.Schema())
    }
  }
}

function makeExcelSafeSheetName(s) {
  let sheetName = s
  if (sheetName.split("\n").length > 0) {
    sheetName = sheetName.split("\n")[0]
  }
  sheetName = sheetName.slice(0, 20)
  sheetName = sheetName.replace("/", "")
  return sheetName
}

function tablesToExcel(ctx, book, listSheetname) {
  for(let tablename of Object.keys(ctx.tables).sort()) {
    var pos = ["F8", "Q8", "AB8", "AK8", "AU8"]
    let table = ctx.tables[tablename]

    // console.log("create", tablename, "sheet", table.altname)
    var sheetName = makeExcelSafeSheetName(table.altname || tablename)
    if(!sheetName) {
      continue
    }
    excel.dup(book, "template", sheetName)

    for(let colname of Object.keys(table.columns)) {
      let column = table.columns[colname]
      excel.sets(book, sheetName, pos, [column.altname, column.name, column.type, "", column.desc])
      pos = excel.offsets(pos, 1, 1)
    }

    excel.sets(book, sheetName, ["Q5"], [table.altname])
  }

  var pos = ["F6", "S6", "AF6", "AU6"]
  for(let tablename of Object.keys(ctx.tables).sort()) {
    let table = ctx.tables[tablename]
    excel.sets(book, listSheetname, pos, [table.altname, table.name, "PostgreSQL", table.desc])
    pos = excel.offsets(pos, 1, 1)
  }

  return
}

exports.Context = Context
exports.schemaToTable = schemaToTable
exports.iterSchemas = iterSchemas
exports.tablesToExcel = tablesToExcel
