#!/usr/bin/env node
// NET Architecture generator: rolled encounters that exist as campaign NPCs are
// linked on their floor (branches included), and every Password, File, and
// Control Node floor carries a DV.
//
// Run with: node tests/test-net-architecture.js

const vm = require("vm");
const { createSandbox, seededRng } = require("./sandbox");
const { assert, section, summary } = require("./test-helpers");

const NPCS = [
  { _id: "n-hound", name: "Hellhound", data: { type: "black ice" } },
  { _id: "n-killer-mook", name: "Killer", data: { type: "mook" } },
  { _id: "n-killer", name: "Killer", data: { type: "black ice" } },
  { _id: "n-pass", name: "Password", data: { type: "defense" } },
];

const ENCOUNTERS = [
  { _id: "e-hk", name: "Hellhound, Killer" },
  { _id: "e-h2", name: "Hellhound x2" },
];

function run(difficulty, seed, npcs = NPCS, encounters = ENCOUNTERS) {
  const ctx = createSandbox();
  ctx.__rng = seededRng(seed);
  vm.runInContext("Math.random = __rng", ctx);
  let saved = null;
  let query = null;
  const queries = [];
  ctx.api.getRecordsByQuery = (type, q, cb) => {
    query = query || { type, q };
    queries.push(type);
    // Mirror the server: $regex on name fails validation, only $in passes
    if (!Array.isArray(q.name?.$in) || Object.keys(q.name).length !== 1) throw new Error("name query must be $in");
    const pool = type === "encounters" ? encounters : npcs;
    cb(pool.filter((n) => q.name.$in.includes(n.name)));
  };
  ctx.api.setValuesOnRecord = (rec, values, cb) => {
    if (values["data.floors"]) saved = values["data.floors"];
    if (cb) cb(rec);
  };
  ctx.generateNetArchitecture({ _id: "arch", data: {} }, difficulty);
  const floors = [];
  ctx.forEachNetArchitectureFloor(saved, (f) => floors.push(f));
  return { floors, query };
}

section("encounter name parsing");
{
  const ctx = createSandbox();
  assert("splits and strips counts", ctx.getNetArchitectureEncounterNames("Raven, Wisp x3, Hellhound"), ["Raven", "Wisp", "Hellhound"]);
  assert("blank", ctx.getNetArchitectureEncounterNames(""), []);
}

section("linking and DVs across many seeds");
{
  let linked = 0;
  let badLink = 0;
  let missingDv = 0;
  let branchLinked = 0;
  let wrongKiller = 0;
  let encounterLinked = 0;
  let groupFallback = 0;
  const encNames = ENCOUNTERS.map((e) => e.name);
  for (const difficulty of ["Basic Floor", "Standard Floor", "Uncommon Floor", "Advanced Floor", undefined, ""]) {
    for (let seed = 1; seed <= 200; seed++) {
      const { floors, query } = run(difficulty, seed);
      if (query && query.type !== "npcs") badLink++;
      floors.forEach((f) => {
        const enc = f.data.encounter;
        const group = enc.includes(",") || /x\d+$/.test(enc);
        const names = enc.split(",").map((s) => s.replace(/\s*x\d+$/, "").trim().toLowerCase());
        const known = names.find((n) => ["hellhound", "killer", "password"].includes(n));
        const rl = f.data.recordLink;
        if (group && encNames.includes(enc)) {
          // Group with a matching Encounter links the Encounter
          if (!rl || rl.type !== "encounters" || rl.value.recordType !== "encounters" || rl.value.name !== enc) badLink++;
          else encounterLinked++;
          if (/^[LR]/.test(f.data.floor)) branchLinked++;
          return;
        }
        if (known && !rl) badLink++;
        if (!known && rl) badLink++;
        if (rl) {
          linked++;
          if (group) groupFallback++;
          if (rl.type !== "npcs" || rl.value.recordType !== "npcs" || rl.value.name.toLowerCase() !== known) badLink++;
          if (known === "killer" && rl.value._id !== "n-killer") wrongKiller++;
          if (/^[LR]/.test(f.data.floor)) branchLinked++;
        }
        if (names.some((n) => ["password", "file", "control node"].includes(n)) && (f.data.dv === null || f.data.dv === undefined)) missingDv++;
      });
    }
  }
  assert("some floors linked to NPCs", linked > 0, true);
  assert("group floors link their Encounter", encounterLinked > 0, true);
  assert("group with no Encounter falls back to first NPC", groupFallback > 0, true);
  assert("branch floors get links too", branchLinked > 0, true);
  assert("every known encounter linked correctly, nothing else", badLink, 0);
  assert("Black ICE preferred over same-named mook", wrongKiller, 0);
  assert("every Password/File/Control Node has a DV", missingDv, 0);
}

section("no matching NPCs still saves floors");
{
  const { floors } = run("Standard Floor", 7, []);
  assert("floors saved", floors.length > 0, true);
  assert("no links", floors.filter((f) => f.data.recordLink).length, 0);
}

process.exit(summary() > 0 ? 1 : 0);
