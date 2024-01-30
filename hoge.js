function deepCompare (arg1, arg2) {
  if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)){
    if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]' ){
      if (Object.keys(arg1).length !== Object.keys(arg2).length ){
        return false;
      }
      return (Object.keys(arg1).every(function(key){
        return deepCompare(arg1[key],arg2[key]);
      }));
    }
    return (arg1===arg2);
  }
  return false;
}

function assert(m, a, b) {
  if (deepCompare(a, b)) {
    console.log("TEST: " + m.padEnd(32) + ": OK")
  } else {
    console.log("TEST: " + m.padEnd(32) + ": FAIL")
    console.log(JSON.stringify(a))
    console.log(JSON.stringify(b))
  }
}
/*
1. object
   ```
   test:
     a: 1
     b: "aaa"
   ```
   ```
   test(a int, b text)
   ```
2. object in object
   ```
   test:
     a: 1
     hoge:
       b: "aaa"
   ```
   ```
   test(a int, hoge_id int foreign key(hoge.id))
   hoge(id int, b text)
   ```
3. object in array
   ```
   Hoge:
     type: array
     items:
       type: object
       properties:
         a:
           type: number
         b:
           type: string
   ```
   ```
   - a: 1
     b: "aaa"
   - a: 2
     b: "aaa"
   ```
   ```
   XXXX(id int, a int, b text)
   ASSOC(id int, XXXX_id int foreign key(XXXX.id))
   ```
   - [ ] can't determine object name (==table name)

4. array
   ```
   - 1
   - 2
   ```
   ```
   XXXX(YYYY int)
   ```
   - [ ] can't determine object name (==table name)
   - [ ] can't determine column name

5. array in object
   ```
   hoge:
   - 1
   - 2
   ```
   ```
   hoge(id int)
   hoge_assoc(hoge_id int, YYYY int)
   ```

6. array in array
   ```
   - - 1
     - 2
   - - 1
     - 2
   ```
   ```
   XXXX(YYYY_id int, ZZZZ int)
   AAAA(BBBB_id int, XXXX_id int foreign key(XXXX.id))
   ```
   - [ ] can't determine object name (==table name)
   - [ ] can't determine column name

7. enum+string
   ```
   "aaa"
   ```
   ```
   test(id int, value text)
   ```

8. enum+string in object
9. enum+string in array

              -    object array
object        1       2      3
array         4       5      6
enum+string   7       8      9

*/

function schemaToTable(schema, name) {
  var ctx = {tables: {}}
  _schemaToTable(ctx, schema, name)
  return ctx.tables
}

function _addColumn(ctx, name, parent, decl) {
  if (parent) {
    if (!ctx.tables[parent]) {
      ctx.tables[parent] = {}
    }
    ctx.tables[parent][name] = decl
  }
}

function _schemaToTable(ctx, schema, name, parent) {
  console.log("NAME:", name, parent)

  // make enum string to master table
  if (schema.Type == "string" && schema.Enum.length > 0) {
    ctx.tables[name] = {id: {type: "number"}, value: {"type": "string"}}

    // add relation column if ctx.cur(parent) exists
    _addColumn(ctx, name, parent, {type: "number", foreign: name+".id"})
  }

  // string without enum are normal column to parent
  if (schema.Type == "string" && schema.Enum.length == 0) {
    _addColumn(ctx, name, parent, {"type": "string"})
  }

  // number are normal column to parent
  if (schema.Type == "number") {
    _addColumn(ctx, name, parent, {"type": "number"})
  }

  // make table
  if (schema.Type == "object") {
    Object.keys(schema.Properties).forEach((prop) => {
      var propSchema = schema.Properties[prop].Schema()
      _schemaToTable(ctx, propSchema, prop, name)
    })
  }

  // make 1:N association
  if (schema.Type == "array") {
    console.log("array")
    // add parent and myself association table and column
    const tablename = parent+"_"+name+"_assoc"
    const foreignKeyName = parent+"_id"
    ctx.tables[tablename] = {id: {type: "number"}, [foreignKeyName]: {type: "number", foreign: parent+".id"}}

    var subSchema = schema.Items.A.Schema()
    _schemaToTable(ctx, subSchema, name, tablename)
  }
}
/*
  var result = {t: {}, c: {}}


  if (schema.Type == "object") {
    Object.keys(schema.Properties).forEach((prop) => {
      var propSchema = schema.Properties[prop].Schema()
      var t = _schemaToTable(propSchema, prop)

      Object.assign(result.t, t.t)
      Object.assign(result.c, t.c)
    })

    result.t[name] = result.c
    result.c = {}
    return result
  }

  result.c[name] = {type: schema.Type[0]}
  return result
  var result = {}

  if (schema.Type == "object") {
    result[name] = {}
    Object.keys(schema.Properties).forEach((prop) => {
      var propSchema = schema.Properties[prop].Schema()

      if (propSchema.Type == "string" && propSchema.Enum.length > 0) {
        result[prop] = {id: {type: "number"}, value: {"type": "string"}}
        result[name][prop] = {type: "number", foreign: prop}
        return
      }

      // make 1:N association
      if (propSchema.Type == "array") {
        const subPropSchema = propSchema.Items.A.Schema()

        // non-nested type are represented in simple association table
        var assocTableName = name+"_"+prop+"_assoc"
        if (subPropSchema.Type == "string" || subPropSchema.Type == "number") {
          result[assocTableName] = {id: {type: "number", foreign: name}, value: {"type": "string"}}
        } else {
          var table = schemaToTable(subPropSchema, assocTableName)
          table[assocTableName]["id"] = {type: "number", foreign: name}
          result[assocTableName] = table[assocTableName]
        }
        return
      }

      // convert object in object to 1:1 relation
      if (propSchema.Type == "object") {
        console.log(Object.keys(schema.Properties), name, prop)
        return
      }

      // otherwise normal column
      result[name][prop] = {type: propSchema.Type[0]}
    })
    return result
  }
*/
var a = jsonschema(`
Hoge:
  type: string
`)
var b = {}
assert("string", a, b)

var a = jsonschema(`type: string`)
var b = {}
assert("string", schemaToTable(a, "test"), b)

var a = jsonschema(`type: number`)
var b = {}
assert("number", schemaToTable(a, "test"), b)

var a = jsonschema(`
type: string
enum:
- a
- b`)
var b = {"test":{"id":{"type":"number"},"value":{"type":"string"}}}
assert("enum string", schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: number
`)
var b = {"test":{"bbb":{"type":"number"},"aaa":{"type":"string"}}}
assert("object", schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: string
    enum:
    - a
    - b
`)
var b = {"bbb":{"id":{"type":"number"},"value":{"type":"string"}},"test":{"bbb":{"type":"number","foreign":"bbb.id"},"aaa":{"type":"string"}}}
assert("enum string in object", schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: array
    items:
      type: string
`)
var b = {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"id":{"type":"number","foreign":"test"},"value":{"type":"string"}}}
assert("array in object", schemaToTable(a, "test"), b)

// 2024/01/30 00:59:34 {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"ccc":{"type":"object"},"id":{"type":"number","foreign":"test"}}}

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: array
    items:
      type: object
      properties:
        ccc:
          type: string
`)
var b = {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"ccc":{"type":"string"},"id":{"type":"number","foreign":"test"}}}
assert("object in array in object", schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: object
`)
// test(id, aaa.id) aaa(id)
// test(id) aaa(test.id) == [{}, {}]
var b = {"test":{"bbb":{"type":"number"},"aaa":{"type":"string"}}}
assert(schemaToTable(a, "test"), b)

var a = jsonschema(`
type: object
properties:
  aaa:
    type: string
  bbb:
    type: array
    items:
      type: object
      properties:
        ccc:
          type: object
          properties:
            ddd:
              type: number
`)
// {aaa: "", bbb: [{ccc: {ddd: 123}}]}
var b = {"test":{"aaa":{"type":"string"}},"test_bbb_assoc":{"ccc":{"type":"string"},"id":{"type":"number","foreign":"test"}}}
assert(schemaToTable(a, "test"), b)
