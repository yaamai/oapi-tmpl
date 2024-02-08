function assert(a, b, m) {
  const rdiff = require('./recursive-diff.min.js')
  const diff = rdiff.getDiff(a, b)

  if (diff.length == 0) {
    console.log("TEST: " + (m||"").padEnd(48) + ": OK")
  } else {
    console.log("TEST: " + (m||"").padEnd(48) + ": FAIL")
    console.log(JSON.stringify(a, null, "  "))
    console.log(JSON.stringify(b, null, "  "))
    console.log(JSON.stringify(diff))
  }
}

function toSnake(camel) {
  return camel.replace(/[A-Z][a-z]/g, c => `_${c.toLowerCase()}`).replace(/[A-Z]+/g, c => `_${c.toLowerCase()}`).replace(/^_/, "")
}

exports.assert = assert
exports.toSnake = toSnake
