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
		[col, row] = CellNameToCoordinates(c)

    if (axis == 0) {
			return CoordinatesToCellName(col+offset, row)
    } else {
			return CoordinatesToCellName(col, row+offset)
    }
  })
}

// set cell indent
function indent(book, sheet, coord, level) {
  style = NewStyleFromCell(book, sheet, coord, {Indent: level})
  book.SetCellStyle(sheet, coord, coord, style)
}

function dup(book, templateSheetName, sheetName) {

    destIndex = book.NewSheet(sheetName)
    sourceIndex = book.GetSheetIndex(templateSheetName)
    book.CopySheet(sourceIndex, destIndex)
}