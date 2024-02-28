const oapi = require('./scripts/oapi.js')

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
}
