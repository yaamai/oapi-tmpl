// set cell values
function sets(book, sheet, coords, vals) {
  coords.forEach((c, idx) => {
    const err = book.SetCellValue(sheet, c, vals[idx])
    if (err) {
      console.log(err)
    }
  })
}

// calc cell address by offset
function offsets(coords, axis, offset) {
  return coords.map((c) => {
    var err, col, row, coord
		[col, row] = excel.cellNameToCoordinates(c)

    if (axis == 0) {
			return excel.coordinatesToCellName(col+offset, row)
    } else {
			return excel.coordinatesToCellName(col, row+offset)
    }
  })
}

// set cell indent
function indent(book, sheet, coord, level) {
  style = excel.newStyleFromCell(book, sheet, coord, {Indent: level})
  book.SetCellStyle(sheet, coord, coord, style)
}

function dup(book, templateSheetName, sheetName) {
    destIndex = book.NewSheet(sheetName)
    sourceIndex = book.GetSheetIndex(templateSheetName)
    book.CopySheet(sourceIndex, destIndex)
}

function deepCompare (arg1, arg2) {
  if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)){
    if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]' ){
      if (Object.keys(arg1).length !== Object.keys(arg2).length ){
        return false;
      }
      return (Object.keys(arg1).every(function(key){
        return deepCompare(arg1[key],arg2[key]);
      }));
    }
    return (arg1===arg2);
  }
  return false;
}

function assert(a, b, m) {
  const rdiff = require('./recursive-diff.min.js')
  const diff = rdiff.getDiff(a, b)

  if (diff.length == 0) {
    console.log("TEST: " + (m||"").padEnd(48) + ": OK")
  } else {
    console.log("TEST: " + (m||"").padEnd(48) + ": FAIL")
    console.log(JSON.stringify(a, null, "  "))
    console.log(JSON.stringify(b, null, "  "))
    console.log(JSON.stringify(diff))
  }
}

function toSnake(camel) {
  return camel.replace(/[A-Z][a-z]/g, c => `_${c.toLowerCase()}`).replace(/[A-Z]+/g, c => `_${c.toLowerCase()}`).replace(/^_/, "")
}

function _getRef(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)
}

function getJAName(schema) {
  const janame = schema.Extensions["x-janame"]
  if (janame) {
    return janame
  }

  return schema.Description
}

// check allOf composition has empty property and refs
function getRef(schema) {
  var ref = _getRef(schema)
  if (ref) {
    return ref
  }

  if (schema.AllOf.length == 0) {
    return null
  }

  var hasMultipleObjectProperties = false
  schema.AllOf.forEach((s) => {
    var r = _getRef(s.Schema())
    if (Object.keys(s.Schema().Properties).length != 0 && !r) {
      hasMultipleObjectProperties = true
    }

    if (r) {
      ref = r
    }
  })
  
  if (hasMultipleObjectProperties) {
    return null
  } else {
    return ref
  }
}

exports.dup = dup
exports.sets = sets
exports.offsets = offsets
exports.assert = assert
exports.toSnake = toSnake
exports.getRef = getRef
exports.getJAName = getJAName
