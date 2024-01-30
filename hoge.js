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

a = `
openapi: 3.0.1
info:
  title: api
  version: 1.0.0
paths: {}
components:
  schemas:
    Hoge:
      type: object
`
assert("", openapischema(a))
