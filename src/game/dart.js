import { dartValues, cricketNumbers } from "../constants.js";
import { formatDart } from "../utils.js";

export { formatDart };

export function getDartValues() {
  return dartValues;
}

export function getCricketDartValues() {
  return [...cricketNumbers.map((n) => n.value), 0];
}

export function buildDart(base, multiplier) {
  return { base, multiplier, score: base * multiplier };
}

export function getRangeLabel(range) {
  if (range === "7d") return "7 derniers jours";
  if (range === "30d") return "30 derniers jours";
  return "Global";
}
