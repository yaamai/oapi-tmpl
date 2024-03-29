const utils = require('./utils.js')
const oapi = require('./oapi.js')

class Context {
  constructor() {
    this.tables = {}
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
  constructor(name, type, altname, desc, foreign) {
    this.name = name
    this.altname = altname
    this.desc = desc
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

class OAPIToDBConverter extends oapi.Traverser {
  constructor(name, schema) {
    super(name, schema)
    this.result = {}
  }

  pre() {
    const type = this.type()


    if (["number", "string", "integer", "boolean"].includes(type)) {
      const [parent, parentPath, parentRef] = this.columnParent()
      let tableName = utils.toSnake(parentRef.split("/").pop()) + "s"
      let tableAltName = oapi.getJaName(parent, tableName)
      let colName = this.path()
      let colDesc = this.schema().Description

      // when primitive type in array, colName == ""
      if (!colName) {
        colName = "value"
      }
      let colAltName = oapi.getJaName(this.schema(), colName)

      let table = this._ensureTable(tableName, tableAltName)
      table.addColumn(new Column(colName, type, colAltName, colDesc, null))
    }

    if (type == "object" || type == "array" || (type == "allOf" && this.schema().ParentProxy.IsReference())) {
      const [parent, parentPath, parentRef] = this.relationParent()
      if(!parent) return
      let tableName = utils.toSnake(parentRef.split("/").pop()) + "s"
      let tableAltName = oapi.getJaName(parent, tableName)
      // TODO: check this.path() (structual path) == toSnake(this.ref()) + "_id"
      let refName = utils.toSnake(this.ref().split("/").pop())
      let refAltName = oapi.getJaName(this.schema(), refName + "s")
      let colName = refName + "_id"
      if (this.path() && refName != this.path()) {
        colName = this.path() + "_" + colName
      }

      let table = this._ensureTable(tableName, tableAltName)
      table.addColumn(new Column(colName, "number", colName, "", new Foreign(colName, refName + "s", this.ref())))

      let refTable = this._ensureTable(refName + "s", refAltName)
      refTable.addColumn(new Column("id", "number", "id", "", null))
      // console.log("REL", parentPath, parentRef, this.path(), this.ref())
      // console.log("REL", tableName, columnName)
    }
  }

  relationParent() {
    let objIndex = this.schemas.slice(0, -1).findLastIndex(s => this.type(s) == "object" || this.type(s) == "array" || this.type(s) == "allOf")
    return [this.schemas[objIndex], this.paths[objIndex], this.refs[objIndex]]
  }

  // determine column(object's property) parent
  columnParent() {
    // normally, object or array are parent
    let objIndex = this.schemas.slice(0, -1).findLastIndex(s => this.type(s) == "object" || this.type(s) == "array")

    // check allOf
    let isParentsParentAllOf = (objIndex > 0 && this.type(this.schemas[objIndex-1]) == "allOf")
    let isParentsParentAllOfReference = (objIndex > 0 && this.schemas[objIndex-1].ParentProxy.IsReference())
    // let isParentsParentAllOfRoot = (objIndex-1 == 0)
    // if (isParentsParentAllOf && (isParentsParentAllOfReference)) {
    //   console.log("column is allof sibling parent:", objIndex-1)
    //   return [this.schemas[objIndex-1], this.paths[objIndex-1], this.refs[objIndex-1]]
    // }
    // console.log("parent:", objIndex)
    return [this.schemas[objIndex], this.paths[objIndex], this.refs[objIndex]]
  }

  _ensureTable(name, altname) {
    if (this.result.hasOwnProperty(name)) {
      return this.result[name]
    } else {
      const table = new Table(name, altname)
      this.result[table.name] = table
      return table
    }
  }
}


exports.OAPIToDBConverter = OAPIToDBConverter
