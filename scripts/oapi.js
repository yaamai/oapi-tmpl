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
  constructor(name, type, desc, parents, indent, repeated, required) {
    this.name = name
    this.type = type
    this.desc = desc
    this.parents = parents
    this.indent = indent
    this.repeated = repeated
    this.required = required
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

function _flattenObject(name, parents, schema, indent, required) {
  const janame = getJaName(schema, name)
  var output = []
  output.push(new FlattenRow(janame, "object", schema.Description, [...parents, name], indent, false, false))

  for(let propname of Object.keys(schema.Properties).sort()) {
    const propSchema = schema.Properties[propname].Schema()
    const prevTopIndex = output.length
    output = output.concat(flatten(propname, [...parents, name], propSchema, indent+1))

    // set required flag
    if (output.length > prevTopIndex) {
      output[prevTopIndex].required = schema.Required.includes(propname)
    }
  }
  return output
}

function _flattenArray(name, parents, schema, indent, required) {
  const janame = getJaName(schema, name)
  const itemSchema = schema.Items.A.Schema()

  var output = []
  output.push(new FlattenRow(janame, "array", schema.Description, [...parents, name], indent, false, false))

  // TODO: check itemSchema is ref
  const itemSchemaName = getRefName(itemSchema)
  output = output.concat(flatten(itemSchemaName, [...parents, name], itemSchema, indent+1))

  // set repated flag to next items on array
  if (output.length > 1) {
    output[1].repeated = true
  }
  return output
}

function flatten(name, parents, schema, indent, required) {
  const type = schema.Type

  if (Object.keys(schema.AllOf).length > 0) {
    return _flattenAllOrOneOf(name, parents, schema, indent, schema.AllOf, required)
  } else if (Object.keys(schema.OneOf).length > 0) {
    return _flattenAllOrOneOf(name, parents, schema, indent, schema.OneOf, required)
  } else if (type == "object") {
    return _flattenObject(name, parents, schema, indent, required)
  } else if (type == "array") {
    return _flattenArray(name, parents, schema, indent, required)
  } else if (type == "string") {
    const janame = getJaName(schema, name)
    return [new FlattenRow(janame, "string", schema.Description, [...parents, name], indent, false, false)]
  } else if (type == "number") {
    const janame = getJaName(schema, name)
    return [new FlattenRow(janame, "number", schema.Description, [...parents, name], indent, false, false)]
  } else {
    // TODO: check this codes are unreached
    return []
  }
}

exports.flatten = flatten
