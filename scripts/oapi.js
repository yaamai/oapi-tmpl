const utils = require('./utils.js')

function getRefName(schema) {
  let m = schema.ParentProxy.GetReference().match(/[^\/]+$/)
  if (!m) {
    return null
  }
  return m[0]
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
  for(let key of Object.keys(target)) {
		const subSchema = target[key].Schema()
    output = output.concat(flatten(name, parents, subSchema, indent))
  }

  // determine last janame and description
  const lastNameObject = output.findLast((e) => (e.indent == indent && e.name) && (e.type == "object" || e.type == "array" || !e.type))
  const lastDescObject = output.findLast((e) => (e.indent == indent && e.desc) && (e.type == "object" || e.type == "array" || !e.type))
  const rootObjectIndex = output.findIndex(e => e.indent == indent && (e.type == "object" || e.type == "array"))
  //console.log(lastNameObject, lastDescObject, rootObjectIndex, JSON.stringify(output, null, "  "))
  if(lastNameObject && lastNameObject.name) {
    output[rootObjectIndex].name = lastNameObject.name
  }
  if (lastDescObject && lastDescObject.desc) {
    output[rootObjectIndex].desc = lastDescObject.desc
  }
  // console.log("###########################", JSON.stringify(output, null, "  "))
  // console.log(rootObjectIndex)

  // remove duplicate object marker row
  output = output.filter((e,idx) => idx == rootObjectIndex || e.type != "object" || e.indent != indent)
  // remove empty janame and description schema
  output = output.filter((e) => e.type)

	output = utils.uniqBy(output, (a, b) => {
    return a.path() == b.path()
	})

  return output
}

function _flattenObject(name, parents, schema, indent, required) {
  // console.log(name, getRefName(schema), JSON.stringify(schema, null, "  "))
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
  const itemSchemaName = getRefName(itemSchema) || getJaName(itemSchema)
  output = output.concat(flatten(itemSchemaName, [...parents, name], itemSchema, indent+1))

  // set repated flag to next items on array
  if (output.length > 1) {
    output[1].repeated = true
  }
  return output
}

function flatten(name, parents, schema, indent, required) {
  const type = schema.Type[0]
  // console.log("TYPE:", type)

  if (Object.keys(schema.AllOf).length > 0) {
    return _flattenAllOrOneOf(name, parents, schema, indent, schema.AllOf, required)
  } else if (Object.keys(schema.OneOf).length > 0) {
    return _flattenAllOrOneOf(name, parents, schema, indent, schema.OneOf, required)
  } else if (type == "object") {
    return _flattenObject(name, parents, schema, indent, required)
  } else if (type == "array") {
    return _flattenArray(name, parents, schema, indent, required)
  } else if (type == "string" || type == "number" || type == "integer" || type == "boolean") {
    const janame = getJaName(schema, name)
    let desc = schema.Description
    if (schema.Enum.length > 0) {
      desc = "Enum:" + schema.Enum.join(",")
    }
    return [new FlattenRow(janame, type, desc, [...parents, name], indent, false, false)]
  } else if (!type && (schema.Description || schema.Extensions["x-janame"])) {
    const janame = getJaName(schema, name)
    return [new FlattenRow(janame, null, schema.Description, parents, indent, false, false)]
  } else {
    console.log("################################################################################################################")
    console.log(name, parents, JSON.stringify(schema), type)
    console.log("################################################################################################################")
    // TODO: check this codes are unreached
    return []
  }
}

function* _get_nested_schemas(schema) {
  const type = schema.Type[0]

  if (type == "array") {
    let sub = schema.Items.A.Schema()
    yield [null, sub]
  }

  if (type == "object") {
    for(let propname of Object.keys(schema.Properties)) {
      let sub = schema.Properties[propname].Schema()
      yield [propname, sub]
    }
  }

  for (let target of [schema.AllOf, schema.OneOf]) {
    for(let index of Object.keys(target)) {
      yield [null, target[index].Schema()]
    }
  }
}

function _schemaType(s) {
  if (Object.keys(s.AllOf).length > 0) return "allOf"
  if (Object.keys(s.OneOf).length > 0) return "oneOf"
  if (s.Type[0]) return s.Type[0]
}

class Traverser {
	constructor(name, schema) {
    this.name = name
    this.schemas = [schema]
    this.paths = ["#/components/schemas/"+name]
    this.refs = ["#/components/schemas/"+name]
  }

  pre() {}
  post() {}

  process() {
    const schema = this.schema()
    // console.log("types:", this.types(), "paths:", this.paths.map(e => e.replace("#/components/schemas/", "")).join("."), "ref:", this.refs.map(e => e.replace("#/components/schemas/", "")).join(","))

    this.pre()
    for (let [name, sub] of _get_nested_schemas(schema)) {
      this.push(name, sub)
      this.process()
      this.pop()
    }
    this.post()
  }

  push(name, sub) {
    let path = ""
    if (name) {
      path = name
    }

    let ref = this.ref()
    if (sub.ParentProxy.IsReference()) {
      ref = sub.ParentProxy.GetReference()
    }

    this.schemas.push(sub)
    this.paths.push(path)
    this.refs.push(ref)
  }

  pop() {
    this.schemas.pop()
    this.paths.pop()
    this.refs.pop()
  }

  schema() {
    return this.schemas[this.schemas.length-1]
  }

  path() {
    return this.paths[this.paths.length-1]
  }

  ref() {
    return this.refs[this.refs.length-1]
  }

  types() {
    return this.schemas.map(_schemaType).join(".")
  }

  type(s) {
    return _schemaType(s || this.schema())
  }
}

exports.flatten = flatten
exports.getJaName = getJaName
exports.getRefName = getRefName
exports.Traverser = Traverser
