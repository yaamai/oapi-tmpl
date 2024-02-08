const utils = require('./utils.js')

function getRefName(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)[0]
}

function flatten(name, parents, schema, indent) {
  const type = schema.Type

  if (Object.keys(schema.AllOf).length > 0) {
    var output = []
    for(let key of Object.keys(schema.AllOf)) {
      var rows = flatten(name, parents, schema.AllOf[key].Schema(), indent)
      output = output.concat(rows)
    }

    // console.log("##", JSON.stringify(output))
		output = utils.uniqBy(output, (a, b) => {
      return a[1].join("-") == b[1].join("-")
		})

    return output
  } else if (type == "object") {
    var output = []
    output.push([name, [...parents, name], indent])

    for(let propname of Object.keys(schema.Properties).sort()) {
      const propSchema = schema.Properties[propname].Schema()
      output = output.concat(flatten(propname, [...parents, name], propSchema, indent+1))
    }
    return output
  } else if (type == "array") {
    var output = []
    output.push([name, [...parents, name], indent])

    const itemSchema = schema.Items.A.Schema()
    // TODO: check itemSchema is ref
    const itemSchemaName = getRefName(itemSchema)
    output = output.concat(flatten(itemSchemaName, [...parents, name], itemSchema, indent+1))
    return output
  } else if (type == "string") {
    return [[name, [...parents, name], indent]]
  } else {
    // TODO: console.log("FAILED")
    return []
  }
}

exports.flatten = flatten
