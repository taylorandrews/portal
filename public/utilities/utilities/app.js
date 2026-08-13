import { UTILITIES, COLORS, currentRunRate, trailing12, highsLows, startAutofill }
  from "./lib/compute.js";
import { renderChart } from "./chart.js";

const $ = (s) => document.querySelector(s);
const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);
let BILLS = [];

async function loadBills() {
  const res = await fetch("/api/utilities/data", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("load failed " + res.status);
  BILLS = (await res.json()).bills;
}

function renderStats() {
  const rr = currentRunRate(BILLS);
  const t12 = trailing12(BILLS, todayISO());
  const hl = highsLows(BILLS, todayISO());
  const shareRows = UTILITIES.map((u) => `
    <div class="share-row">
      <span>${u}</span>
      <span class="share-bar" style="background:${COLORS[u]};width:${Math.max(2, t12.shares[u] * 100).toFixed(1)}%"></span>
      <span>${money(t12.byUtility[u])} · ${(t12.shares[u] * 100).toFixed(0)}%</span>
    </div>`).join("");
  const monthName = (m) => m ? new Date(m + "-01T00:00:00Z").toLocaleString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" }) : "—";
  $("#stats").innerHTML = `
    <div class="stat-card runrate">
      <h3>Current run-rate</h3>
      <div class="big">≈ ${money(rr.perDay)}<span class="sub">/day</span></div>
      <div class="sub">≈ ${money(rr.perMonth)}/mo across all utilities</div>
    </div>
    <div class="stat-card">
      <h3>Where costs come from · last 12 mo</h3>
      ${shareRows}
    </div>
    <div class="stat-card">
      <h3>Highs & lows</h3>
      <div class="sub">Priciest utility: <b style="color:${COLORS[hl.utilityHigh?.utility]}">${hl.utilityHigh?.utility ?? "—"}</b> (${money(hl.utilityHigh?.total ?? 0)})</div>
      <div class="sub">Cheapest utility: <b style="color:${COLORS[hl.utilityLow?.utility]}">${hl.utilityLow?.utility ?? "—"}</b> (${money(hl.utilityLow?.total ?? 0)})</div>
      <div class="sub">Priciest month: <b>${monthName(hl.monthHigh?.month)}</b> (${money(hl.monthHigh?.total ?? 0)})</div>
      <div class="sub">Cheapest month: <b>${monthName(hl.monthLow?.month)}</b> (${money(hl.monthLow?.total ?? 0)})</div>
    </div>`;
}

function initTabs() {
  document.querySelectorAll(".tab").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b === btn));
    document.querySelectorAll(".panel").forEach((p) =>
      p.classList.toggle("is-active", p.id === "tab-" + btn.dataset.tab));
    if (btn.dataset.tab === "chart") renderChart($("#chart"), BILLS);
  }));
}

function renderAll() { renderStats(); if ($("#tab-chart").classList.contains("is-active")) renderChart($("#chart"), BILLS); }

function setStatus(msg, kind) {
  const el = $("#entry-status");
  el.textContent = msg; el.className = "status " + (kind || "");
}

function initEntryForm() {
  const util = $("#f-utility"), start = $("#f-start"), end = $("#f-end"), amount = $("#f-amount");
  util.addEventListener("change", () => {
    const auto = startAutofill(BILLS, util.value);
    if (auto) { start.value = auto; end.focus?.(); }
  });
  $("#entry").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = { utility: util.value, start: start.value, end: end.value, amount: Number(amount.value) };
    if (!payload.utility) return setStatus("Pick a utility first.", "err");
    if (payload.end < payload.start) return setStatus("End date can't be before start.", "err");
    if (!(payload.amount > 0)) return setStatus("Amount must be greater than 0.", "err");
    setStatus("Saving…", "");
    try {
      const res = await fetch("/api/utilities/bill", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return setStatus(data.error || "Save failed.", "err");
      BILLS = data.bills;
      if (data.sheet.ok) setStatus("✅ Saved. Row added to the spreadsheet.", "ok");
      else setStatus("⚠️ Saved to the app, but the spreadsheet update failed (will retry next time). " + (data.sheet.error || ""), "warn");
      amount.value = ""; end.value = "";
      renderAll();
    } catch (err) { setStatus("Network error: " + err.message, "err"); }
  });
}

async function main() {
  initTabs();
  initEntryForm();
  try { await loadBills(); renderAll(); }
  catch (e) { $("#stats").innerHTML = `<div class="stat-card err">Couldn't load data: ${e.message}</div>`; }
}
main();
