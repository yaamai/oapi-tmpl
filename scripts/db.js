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
  constructor(name, type, foreign) {
    this.name = name
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
    const [parent, parentPath, parentRef] = this.columnParent()

    if(!parent) return

    if (["number", "string", "integer", "boolean"].includes(type)) {
      let tableName = utils.toSnake(parentRef.split("/").pop()) + "s"
      let colName = this.path()

      let table = this._ensureTable(tableName, tableName)
      table.addColumn(new Column(colName, type, null))
    }

    if (type == "object") {
      let tableName = utils.toSnake(parentRef.split("/").pop()) + "s"
      // TODO: check this.path() (structual path) == toSnake(this.ref()) + "_id"
      let colName = utils.toSnake(this.ref().split("/").pop())

      let table = this._ensureTable(tableName, tableName)
      table.addColumn(new Column(colName + "_id", "number", new Foreign(colName + "_id", colName + "s", this.ref())))
      console.log("REL", parentPath, parentRef, this.path(), this.ref())
      // console.log("REL", tableName, columnName)
    }
  }

  columnParent() {
    let objIndex = this.schemas.slice(0, -1).findLastIndex(s => this.type(s) == "object")
    // [?<!object.]allOf.object => return allOf
    if ((objIndex > 0 && this.type(this.schemas[objIndex-1]) == "allOf") && (objIndex < 1 || this.type(this.schemas[objIndex-2]) != "object")) {
      return [this.schemas[objIndex-1], this.paths[objIndex-1], this.refs[objIndex-1]]
    }
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
