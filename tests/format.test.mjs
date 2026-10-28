import test from "node:test";
const clean = (s) => String(s).replace(/\u00A0/g, " ");
import assert from "node:assert/strict";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  pluralize,
  statusMeta,
  methodLabel,
  cpvSectionName,
  csvEscape,
  initials,
} from "../lib/format.ts";
import { parseFilters, filtersToQuery, countActiveFilters } from "../lib/params.ts";

test("formatMoney formats UAH with symbol", () => {
  assert.equal(clean(formatMoney(1234567)), "1 234 567 ₴");
  assert.equal(clean(formatMoney(0)), "0 ₴");
  assert.equal(formatMoney(null), "—");
  assert.equal(formatMoney(undefined), "—");
});

test("formatMoney compacts billions and millions", () => {
  assert.match(clean(formatMoney(14_100_000_000, { compact: true })), /14,1 млрд ₴/);
  assert.match(clean(formatMoney(2_400_000, { compact: true })), /2,4 млн ₴/);
  assert.match(clean(formatMoney(15_000, { compact: true })), /15 тис ₴/);
});

test("formatMoney without symbol and negative", () => {
  assert.equal(clean(formatMoney(-5000, { withSymbol: false })), "−5 000");
});

test("formatNumber handles thousands and compact", () => {
  assert.equal(clean(formatNumber(5999)), "5 999");
  assert.match(clean(formatNumber(1_500_000, true)), /1,5 млн/);
  assert.equal(formatNumber(null), "—");
});

test("formatPercent", () => {
  assert.equal(clean(formatPercent(36.7)), "36,7%");
  assert.equal(formatPercent(null), "—");
});

test("pluralize follows Ukrainian rules", () => {
  assert.equal(pluralize(1, "пропозиція", "пропозиції", "пропозицій"), "пропозиція");
  assert.equal(pluralize(3, "пропозиція", "пропозиції", "пропозицій"), "пропозиції");
  assert.equal(pluralize(5, "пропозиція", "пропозиції", "пропозицій"), "пропозицій");
  assert.equal(pluralize(11, "пропозиція", "пропозиції", "пропозицій"), "пропозицій");
  assert.equal(pluralize(21, "пропозиція", "пропозиції", "пропозицій"), "пропозиція");
});

test("statusMeta maps sub-statuses to tones", () => {
  assert.equal(statusMeta("active.tendering").tone, "active");
  assert.equal(statusMeta("complete").tone, "complete");
  assert.equal(statusMeta("cancelled").tone, "cancelled");
  assert.equal(statusMeta("unsuccessful").tone, "unsuccessful");
  assert.equal(statusMeta("draft").tone, "neutral");
});

test("methodLabel translates known methods", () => {
  assert.equal(methodLabel("open"), "Відкриті торги");
  assert.equal(methodLabel("reporting"), "Звіт про закупівлю");
  assert.equal(methodLabel("custom"), "custom");
  assert.equal(methodLabel(null), "—");
});

test("cpvSectionName resolves sections", () => {
  assert.equal(cpvSectionName("45"), "Будівництво");
  assert.equal(cpvSectionName("45.21"), "Будівництво");
  assert.equal(cpvSectionName("99"), "Інше");
});

test("csvEscape quotes separators and quotes", () => {
  assert.equal(csvEscape("simple"), "simple");
  assert.equal(csvEscape('a;b'), '"a;b"');
  assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
});

test("initials extracts two letters", () => {
  assert.equal(initials("ТОВ «Київбуд»"), "ТК");
  assert.equal(initials("Приватне підприємство Альфа"), "ПП");
});

test("parseFilters handles raw query params", () => {
  const f = parseFilters({
    q: "ремонт",
    status: "complete",
    cpv: "45",
    amountMin: "1000",
    amountMax: "500000",
    page: "2",
  });
  assert.equal(f.q, "ремонт");
  assert.equal(f.status, "complete");
  assert.equal(f.amountMin, 1000);
  assert.equal(f.amountMax, 500000);
  assert.equal(f.page, 2);
});

test("parseFilters ignores invalid numbers", () => {
  const f = parseFilters({ amountMin: "abc", page: "-4" });
  assert.equal(f.amountMin, undefined);
  assert.equal(f.page, 1);
});

test("filtersToQuery round-trips and omits defaults", () => {
  const f = parseFilters({ q: "мед", region: "Київ", cpv: "33", page: "3" });
  const qs = filtersToQuery(f);
  assert.match(qs, /q=%D0%BC%D0%B5%D0%B4/);
  assert.match(qs, /region=/);
  assert.match(qs, /page=3/);
  assert.ok(!qs.includes("sort="));
});

test("countActiveFilters counts applied filters", () => {
  assert.equal(countActiveFilters(parseFilters({})), 0);
  assert.equal(countActiveFilters(parseFilters({ q: "a", status: "complete", cpv: "45" })), 3);
});
