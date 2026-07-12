import test from "node:test";
import assert from "node:assert/strict";
import { applyUpdates } from "./trip.js";

const base = () => ({
  trip_name: "t",
  days: [
    { date: "2026-08-14", title: "KC day", stay: { status: "booked", name: "Home" } },
    { date: "2026-08-15", title: "Drive", stay: { status: "idea", note: "somewhere" } },
  ],
});

test("parsed op shallow-merges into the matching day and flags it live", () => {
  const updates = [{
    id: "1", ts: "now", text: "staying in Denver the 15th", status: "parsed",
    patch: { summary: "Stay in Denver Aug 15", ops: [
      { date: "2026-08-15", set: { stay: { status: "idea", note: "Denver" } } },
    ] },
  }];
  const { schedule, pending } = applyUpdates(base(), updates);
  assert.equal(schedule.days[1].stay.note, "Denver");
  assert.equal(schedule.days[1]._live, true);
  assert.equal(schedule.days[1].title, "Drive"); // untouched keys survive
  assert.equal(pending.length, 0);
});

test("null in set deletes a key; note appends to day.notes", () => {
  const updates = [{
    id: "1", ts: "now", text: "x", status: "parsed",
    patch: { summary: "s", ops: [
      { date: "2026-08-14", set: { stay: null }, note: "check tee time" },
    ] },
  }];
  const { schedule } = applyUpdates(base(), updates);
  assert.equal(schedule.days[0].stay, undefined);
  assert.deepEqual(schedule.days[0].notes, ["check tee time"]);
});

test("raw / unmatched updates surface as pending, never crash", () => {
  const updates = [
    { id: "1", ts: "now", text: "??", status: "raw", patch: null },
    { id: "2", ts: "now", text: "y", status: "parsed",
      patch: { summary: "s", ops: [{ date: "2099-01-01", note: "no such day" }] } },
  ];
  const { schedule, pending } = applyUpdates(base(), updates);
  assert.equal(pending.length, 2);
  assert.equal(pending[1].text, "no such day");
  assert.ok(!schedule.days.some((d) => d._live));
});

test("updates apply in order — later wins", () => {
  const mk = (id, note) => ({
    id, ts: "now", text: note, status: "parsed",
    patch: { summary: note, ops: [{ date: "2026-08-15", set: { stay: { status: "idea", note } } }] },
  });
  const { schedule } = applyUpdates(base(), [mk("1", "Denver"), mk("2", "Boulder")]);
  assert.equal(schedule.days[1].stay.note, "Boulder");
});

test("base object is not mutated", () => {
  const b = base();
  applyUpdates(b, [{ id: "1", ts: "n", text: "x", status: "parsed",
    patch: { summary: "s", ops: [{ date: "2026-08-14", set: { title: "CHANGED" } }] } }]);
  assert.equal(b.days[0].title, "KC day");
});
