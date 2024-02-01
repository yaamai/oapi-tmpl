var book = excelfile("")
var pos = excel.coordinatesToCellName(1,1)
const err = book.SetCellValue("Sheet1", pos, "hello")
book.SaveAs("test.xlsx")
