import statsJson from "../../data/stats.json";
import type { Stats } from "./types";

export const stats = statsJson as unknown as Stats;
