#!/usr/bin/env node
/**
 * The dataset agrees with itself and with the demos already live.
 *
 * The whole reason for one dataset is that a visitor who opens two demos sees one
 * business. So the checks that matter most are the ones against what is already
 * published: the four prices on the Avo venue page, and the prices on the invoice
 * reader's sample invoice.
 */
import { readFileSync, readdirSync } from "node:fs";
import { MENU, INGREDIENTS, ingredient, menuItem, CHANNELS, POLICY, listings, appPriceFor, roundUpToEnding, SITES, GROUP, STAFF, ROLES, person } from "../src/index.js";

let failed = 0;
const check = (name, cond) => {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}`); failed += 1; }
};

console.log("the policy cannot be short");
check("rounding never goes down", [2415, 2449, 2450, 2451, 2499, 2500, 100].every((c) => roundUpToEnding(c) >= c));
check("2415 becomes 24.49", roundUpToEnding(2415) === 2449);
check("2450 becomes 24.99", roundUpToEnding(2450) === 2499);
check("2499 stays 24.99", roundUpToEnding(2499) === 2499);
check("2500 becomes 25.49", roundUpToEnding(2500) === 2549);
check("every app price is at least 15% over the till", MENU.every((m) => appPriceFor(m.posCents) >= m.posCents * (1 + POLICY.appMarkup)));

console.log("\nit agrees with the live demos");
const avo = { margherita: 2100, "half-chicken": 2650, "avocado-toast": 1650, latte: 575 };
check("the four Avo venue prices", Object.entries(avo).every(([id, c]) => menuItem(id)?.posCents === c));
const invoice = { mozzarella: 945, flour: 190, "chicken-thigh": 1340, butter: 1216, canola: 218, tomato: 307, avocado: 131, salmon: 2450 };
check("the invoice reader's sample prices", Object.entries(invoice).every(([id, c]) => ingredient(id)?.cents === c));
check("the delivery reconciliation's commission rates",
  CHANNELS.find((c) => c.id === "doordash").feeRate === 0.25 && CHANNELS.find((c) => c.id === "ubereats").feeRate === 0.3 && CHANNELS.find((c) => c.id === "skip").feeRate === 0.2);
check("the morning sheet's four rooms", SITES.map((s) => s.name).join() === "Harbour Street,Lonsdale,Oakridge food hall,Langley");
check("the group is Harbour & Co", GROUP.name === "Harbour & Co");

console.log("\nit agrees with itself");
check("every recipe ingredient exists", MENU.every((m) => Object.keys(m.recipe).every((k) => ingredient(k))));
check("every pack item exists", MENU.every((m) => m.pack.every((k) => ingredient(k))));
check("ids are unique", new Set(MENU.map((m) => m.id)).size === MENU.length && new Set(INGREDIENTS.map((i) => i.id)).size === INGREDIENTS.length);
const food = (m) => m.pantryCents + Object.entries(m.recipe).reduce((a, [k, q]) => a + q * ingredient(k).cents, 0);
check("food cost sits between 12% and 35% on every item", MENU.every((m) => food(m) / m.posCents > 0.12 && food(m) / m.posCents < 0.35));

console.log("\nthe planted drift is there, and nothing else");
const L = listings();
const on = (ch, id) => L[ch].find((l) => l.itemId === id);
check("Uber has three plates at pre-August prices", ["half-chicken", "salmon-plate", "burger"].every((id) => on("ubereats", id).cents < appPriceFor(menuItem(id).posCents)));
check("DoorDash avocado toast has no markup", on("doordash", "avocado-toast").cents === 1650);
check("Skip margherita is $2 over", on("skip", "margherita").cents === appPriceFor(2100) + 200);
check("Skip does not list the tofu bowl", !on("skip", "tofu-bowl"));
check("two mappings wait for a person", Object.values(L).flat().filter((l) => l.mapping === "suggested").length === 2);
check("the website latte is stale", on("website", "latte").cents === 550);
const planted = new Set(["ubereats:half-chicken", "ubereats:salmon-plate", "ubereats:burger", "doordash:avocado-toast", "skip:margherita", "website:latte"]);
const offPolicy = CHANNELS.flatMap((c) => L[c.id].filter((l) => {
  const m = menuItem(l.itemId);
  const want = c.kind === "app" ? appPriceFor(m.posCents) : m.posCents;
  return l.cents !== want;
}).map((l) => `${c.id}:${l.itemId}`));
check("no other listing is off policy", offPolicy.length === planted.size && offPolicy.every((k) => planted.has(k)));

console.log("\nthe people");
check("every person works at a real site", STAFF.every((s) => SITES.some((x) => x.id === s.site) && (s.alsoAt ?? []).every((a) => SITES.some((x) => x.id === a))));
check("every role is defined", STAFF.every((s) => ROLES[s.role]));
check("ids are unique", new Set(STAFF.map((s) => s.id)).size === STAFF.length);
check("exactly one director, the owner", STAFF.filter((s) => s.kind === "director").length === 1 && person("E001").role === "owner");
check("every room has a manager or lead and a kitchen", SITES.every((x) => STAFF.some((s) => s.site === x.id && ROLES[s.role].side === "boh")));

console.log("\nthe words");
const src = readdirSync(new URL("../src", import.meta.url)).map((f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8")).join("\n");
check("no em dashes", !src.includes("\u2014"));

console.log(failed ? `\n${failed} failure(s)` : "\nall passed");
process.exit(failed ? 1 : 0);
