// console.log("hoge");
// console.log(Object.keys(doc))
// console.log(Object.keys(doc.Model))
// console.log(Object.keys(doc.Model.Paths))
// console.log(Object.keys(doc.Model.Paths.PathItems["/pets"]))
// console.log(doc.Model.Paths.PathItems["/pets"].Get.Summary)
console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get))
console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.BuildSchema().Properties))
console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema()))
console.log(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema().Type)
// console.log(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema().Items[0].Schema().Properties)
console.log(Object.keys(doc.Model.Paths.PathItems["/pets"].Get.Responses.Codes[200].Content["application/json"].Schema.Schema().Items.A.Schema().Properties))


var pos = ["B2", "E2", "I2"]
set("シート1", pos, ["1", "2", "33"])
//  .Model.Paths.PathItems.length);
