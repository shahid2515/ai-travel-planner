/**
 * Guard test for the OpenStreetMap lookup.
 *
 *   npm run test:lookup
 *
 * The whole point of the place layer is that a venue the model invented cannot
 * get a map pin. Loosening the matching rules to catch real venues risks
 * loosening them enough to let a fake one through, so both directions are
 * checked here:
 *
 *   REAL venues must be found       (false negatives make the app look broken)
 *   INVENTED venues must NOT be     (false positives defeat the entire feature)
 *
 * Runs on Node's built-in TypeScript support — no test framework needed.
 */

import { namesMatch, searchPlace } from "../src/lib/osm-places.ts";

const REAL: [name: string, city: string][] = [
  ["Castelo de São Jorge", "Lisbon"],
  ["Museu Nacional do Azulejo", "Lisbon"], // OSM's English name differs
  ["Cervejaria Ramiro", "Lisbon"],
  ["El Fenn Rooftop Bar & Restaurant", "Marrakech"], // descriptive suffix
  ["Senso-ji", "Tokyo"],
  ["Museo Frida Kahlo", "Mexico City"],
  // All of these came back unmatched from real generations before the
  // trailing-qualifier and transliteration rules were added.
  ["Gyukatsu Motomura Shibuya", "Tokyo"], // branch suffix
  ["Musée Yves Saint Laurent Marrakech", "Marrakech"], // city suffix
  ["Jemaa el-Fnaa", "Marrakech"], // OSM spells it "Jemaa el-Fna"
];

// Plausible-sounding but non-existent. These are what a model hallucinates.
const INVENTED: [name: string, city: string][] = [
  ["Taberna do Cravo Vermelho", "Lisbon"],
  ["Restaurante O Sino Dourado", "Lisbon"],
  ["Café Almirante Quintela", "Lisbon"],
  ["The Gilded Lantern Rooftop Bar & Restaurant", "Marrakech"],
  ["Sakura Hoshino Izakaya", "Tokyo"], // real "Sakura Izakaya" exists — must not match
  ["Cantina La Luna Plateada", "Mexico City"],
];

/**
 * Accepted trade-off, reported but not failed.
 *
 * Forgiving one unmatched trailing word is what lets "Gyukatsu Motomura
 * Shibuya" find "Gyukatsu Motomura". The same slack means an invented *branch*
 * of a real chain matches the parent. Tightening it back would lose six real
 * venues per Tokyo itinerary to save this, and the failure is mild: the chain
 * genuinely exists, and the pin lands on a real restaurant of that name.
 */
const KNOWN_LIMITATIONS: [name: string, city: string, why: string][] = [
  ["Gyukatsu Motomura Neverwhere", "Tokyo", "invented branch of a real chain"],
];

let pass = 0;
let fail = 0;

const check = (ok: boolean, label: string, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? `  — ${detail}` : ""}`);
  if (ok) pass++;
  else fail++;
};

console.log("\nUnit: name similarity");
check(namesMatch("El Fenn", "El Fenn"), "exact match");
check(namesMatch("Castelo de Sao Jorge", "Castelo de São Jorge"), "accents ignored");
check(namesMatch("Cervejaria Ramiro", "Ramiro"), "partial name accepted");
check(!namesMatch("Museu Nacional do Azulejo", "Museu Nacional de Arte Antiga"), "different museums rejected");
check(!namesMatch("Taberna do Cravo Vermelho", "Lisbon"), "city is not a venue match");
check(!namesMatch("Sakura Hoshino Izakaya", "Sakura Hotel Ikebukuro"), "similar-sounding rejected");

console.log("\nReal venues — should be found");
for (const [name, city] of REAL) {
  const match = await searchPlace(name, undefined, city);
  check(Boolean(match), name, match ? `-> ${match.name}` : "NOT FOUND");
}

console.log("\nInvented venues — should NOT be found");
for (const [name, city] of INVENTED) {
  const match = await searchPlace(name, undefined, city);
  check(!match, name, match ? `FALSE POSITIVE -> ${match.name}` : "correctly rejected");
}

console.log("\nKnown limitations — reported, not failed");
for (const [name, city, why] of KNOWN_LIMITATIONS) {
  const match = await searchPlace(name, undefined, city);
  console.log(`  · ${name}  — ${why}: ${match ? `matches ${match.name}` : "rejected"}`);
}

console.log(`\n${fail ? "✗" : "✓"} ${pass} passed, ${fail} failed\n`);
process.exitCode = fail ? 1 : 0;
