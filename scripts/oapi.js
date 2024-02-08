function getRefName(schema) {
  return schema.ParentProxy.GetReference().match(/[^\/]+$/)[0]
}

function flatten(name, schema, indent) {
  const type = schema.Type

  if (type == "object") {
    var output = []
    output.push([name, indent])

    for(let propname of Object.keys(schema.Properties).sort()) {
      const propSchema = schema.Properties[propname].Schema()
      output = output.concat(flatten(propname, propSchema, indent+1))
    }
    return output
  } else if (type == "array") {
    var output = []
    output.push([name, indent])

    const itemSchema = schema.Items.A.Schema()
    // TODO: check itemSchema is ref
    const itemSchemaName = getRefName(itemSchema)
    output = output.concat(flatten(itemSchemaName, itemSchema, indent+1))
    return output
  } else if (type == "string") {
    return [[name, indent]]
  }
}

exports.flatten = flatten
