const utils = require('./utils.js')

function getRefName(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)[0]
}

function getJaName(schema, name) {
  if (schema.Extensions["x-janame"]) {
    return schema.Extensions["x-janame"]
  } else if (schema.Description) {
    return schema.Description
  } else {
    return name
  }
}

function flatten(name, parents, schema, indent) {
  const type = schema.Type
  var janame = getJaName(schema, name)

  if (Object.keys(schema.AllOf).length > 0) {
    var output = []
    var janame = ""
    for(let key of Object.keys(schema.AllOf)) {
			const subSchema = schema.AllOf[key].Schema()
			janame = getJaName(subSchema)
      output = output.concat(flatten(name, parents, subSchema, indent))
    }

    // console.log("##", JSON.stringify(output))

		// remove duplicate properties
		output = utils.uniqBy(output, (a, b) => {
      return a[1].join("-") == b[1].join("-")
		})

		// overwrite janame to latest allOf member's janame
    // assume output[0] is object (currently supports only allOf: [object, object])
    if (janame) {
      output[0][0] = janame
    }

    return output
  } else if (type == "object") {
    var output = []
    output.push([janame, [...parents, name], indent])

    for(let propname of Object.keys(schema.Properties).sort()) {
      const propSchema = schema.Properties[propname].Schema()
      output = output.concat(flatten(propname, [...parents, name], propSchema, indent+1))
    }
    return output
  } else if (type == "array") {
    var output = []
    output.push([janame, [...parents, name], indent])

    const itemSchema = schema.Items.A.Schema()
    // TODO: check itemSchema is ref
    const itemSchemaName = getRefName(itemSchema)
    output = output.concat(flatten(itemSchemaName, [...parents, name], itemSchema, indent+1))
    return output
  } else if (type == "string") {
    return [[janame, [...parents, name], indent]]
  } else {
    // TODO: console.log("FAILED")
    return []
  }
}

exports.flatten = flatten
