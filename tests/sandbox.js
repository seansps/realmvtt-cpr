// Shared sandbox: loads common.js and the utility scripts into a VM context
// the same way the platform concatenates them.
const fs = require("fs");
const vm = require("vm");

const rollhandlersDir = __dirname + "/../rollhandlers";

function createSandbox() {
  let uuid = 0;
  const sandbox = {
    api: {
      getValue: () => null,
      setValue: () => {},
      setValues: () => {},
      getRecord: () => {},
      getRecordsByQuery: () => {},
      getSession: () => undefined,
      setSession: () => {},
      showNotification: () => {},
      rollInstant: () => ({ total: 5 }),
    },
    record: { data: {}, fields: {}, _id: "test" },
    console,
  };
  const ctx = vm.createContext(sandbox);
  ["common.js", "npcBuilder.js"].forEach((file) => {
    const code = fs.readFileSync(`${rollhandlersDir}/${file}`, "utf8");
    new vm.Script(code, { filename: file }).runInContext(ctx);
  });
  // Deterministic ids for assertions
  ctx.generateUuid = () => `id${++uuid}`;
  return ctx;
}

// Deterministic Math.random replacement
function seededRng(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Read a top-level const from the sandbox (consts aren't context properties)
function constant(ctx, name) {
  return vm.runInContext(name, ctx);
}

module.exports = { createSandbox, seededRng, constant };
