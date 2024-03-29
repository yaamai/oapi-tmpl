// set cell values
function sets(book, sheet, coords, vals) {
  coords.forEach((c, idx) => {
    let val = vals[idx]
    if (!val) {
      val = ""
    }
    val = val.toString().replace("<", "?ｼ?")
    val = val.toString().replace(">", "?ｼ?")
    const err = book.SetCellValue(sheet, c, val)
    if (err) {
      console.log(err)
    }
  })
}

// calc cell address by offset
function offsets(coords, axis, offset) {
  return coords.map((c) => {
    var err, col, row, coord
		[col, row] = excelize.cellNameToCoordinates(c)

    if (axis == 0) {
			return excelize.coordinatesToCellName(col+offset, row)
    } else {
			return excelize.coordinatesToCellName(col, row+offset)
    }
  })
}

// set cell indent
function indent(book, sheet, coord, level) {
  style = excelize.newStyleFromCell(book, sheet, coord, {Indent: level})
  book.SetCellStyle(sheet, coord, coord, style)
}

// duplicate worksheet
function dup(book, templateSheetName, sheetName) {
    destIndex = book.NewSheet(sheetName)
    sourceIndex = book.GetSheetIndex(templateSheetName)
    book.CopySheet(sourceIndex, destIndex)
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
exports.indent = indent
exports.getRef = getRef
exports.getJAName = getJAName
