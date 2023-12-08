console.log("hoge");
console.log(Object.keys(doc))
console.log(Object.keys(doc.Model))
console.log(Object.keys(doc.Model.Paths))
console.log(Object.keys(doc.Model.Paths.PathItems["/pets"]))
console.log(doc.Model.Paths.PathItems["/pets"].Get.Summary)


var pos = ["B2", "E2", "I2"]
set("シート1", pos, ["1", "2", "33"])
//  .Model.Paths.PathItems.length);
