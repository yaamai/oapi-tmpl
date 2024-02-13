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

class FlattenRow {
  constructor(name, type, parents, indent) {
    this.name = name
    this.type = type
    this.parents = parents
    this.indent = indent
  }
  path() {
    return this.parents.join("-")
  }
}

function _flattenAllOrOneOf(name, parents, schema, indent, target) {
  var output = []
  var janame = ""
  for(let key of Object.keys(target)) {
		const subSchema = target[key].Schema()
		janame = getJaName(subSchema)
    output = output.concat(flatten(name, parents, subSchema, indent))
  }

  console.log("allOf/oneOf", JSON.stringify(output))
	// remove duplicate properties
	output = utils.uniqBy(output, (a, b) => {
    return a.path() == b.path()
	})

	// overwrite janame to latest allOf member's janame
  // assume output[0] is object (currently supports only allOf: [object, object])
  if (janame) {
    output[0].name = janame
  }

  return output
}

function _flattenObject(name, parents, schema, indent) {
  const janame = getJaName(schema, name)
  var output = []
  output.push(new FlattenRow(janame, "object", [...parents, name], indent))

  for(let propname of Object.keys(schema.Properties).sort()) {
    const propSchema = schema.Properties[propname].Schema()
    output = output.concat(flatten(propname, [...parents, name], propSchema, indent+1))
  }
  return output
}

function _flattenArray(name, parents, schema, indent) {
  const janame = getJaName(schema, name)
  const itemSchema = schema.Items.A.Schema()

  var output = []
  output.push(new FlattenRow(janame, "array", [...parents, name], indent))

  // TODO: check itemSchema is ref
  const itemSchemaName = getRefName(itemSchema)
  output = output.concat(flatten(itemSchemaName, [...parents, name], itemSchema, indent+1))
  return output
}

function flatten(name, parents, schema, indent) {
  const type = schema.Type

  if (Object.keys(schema.AllOf).length > 0) {
    return _flattenAllOrOneOf(name, parents, schema, indent, schema.AllOf)
  } else if (Object.keys(schema.OneOf).length > 0) {
    return _flattenAllOrOneOf(name, parents, schema, indent, schema.OneOf)
  } else if (type == "object") {
    return _flattenObject(name, parents, schema, indent)
  } else if (type == "array") {
    return _flattenArray(name, parents, schema, indent)
  } else if (type == "string") {
    const janame = getJaName(schema, name)
    return [new FlattenRow(janame, "string", [...parents, name], indent)]
  } else if (type == "number") {
    const janame = getJaName(schema, name)
    return [new FlattenRow(janame, "number", [...parents, name], indent)]
  } else {
    // TODO: check this codes are unreached
    return []
  }
}

exports.flatten = flatten
