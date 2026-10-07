import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import crops from "../data/crops";
import type { ReferenceCrop, Season } from "../types/app-types";
import { useTheme } from "../context/ThemeContext";

const SEASON_DAYS = 30;
const CROPS_PER_BAG = 9;

const seasonDetails = {
  Spring: {
    icon: "✿",
    tagline: "Fresh starts & tender shoots",
    accent: "#4f8061",
    soft: "#e5f0e3",
    panel: "from-[#f5fbf1] to-[#edf6e9]",
  },
  Summer: {
    icon: "☀",
    tagline: "Long days & generous growth",
    accent: "#b4772f",
    soft: "#fff0d6",
    panel: "from-[#fff9ed] to-[#fff1d8]",
  },
  Fall: {
    icon: "❧",
    tagline: "Golden days & final harvests",
    accent: "#a95d3b",
    soft: "#f8e5d9",
    panel: "from-[#fff4eb] to-[#f8e5d9]",
  },
  Winter: {
    icon: "✧",
    tagline: "Rest, reflect & prepare",
    accent: "#55758c",
    soft: "#e4edf3",
    panel: "from-[#f2f7fa] to-[#e3edf3]",
  },
} as const;

type CropMetrics = {
  harvests: number;
  totalHarvested: number;
  seedCost: number;
  revenue: number;
  profit: number;
  profitPerDay: number;
  firstHarvestDay: number | null;
};

function calculateMetrics(
  crop: ReferenceCrop,
  plantingDay: number,
  plots: number,
): CropMetrics {
  let harvests = 0;
  let firstHarvestDay: number | null = null;
  let harvestDay = plantingDay + crop.harvest_time;
  const interval = crop.regrowth_time ?? crop.harvest_time;

  while (harvestDay <= SEASON_DAYS) {
    if (firstHarvestDay === null) firstHarvestDay = harvestDay;
    harvests += 1;
    harvestDay += interval;
  }

  const purchasesPerCycle = Math.ceil(plots / CROPS_PER_BAG);
  const seedPurchases = crop.regrowth_time
    ? purchasesPerCycle
    : purchasesPerCycle * harvests;
  const totalHarvested = plots * harvests;
  const seedCost = seedPurchases * crop.seed_cost;
  const revenue = totalHarvested * crop.sell_price;
  const profit = revenue - seedCost;

  return {
    harvests,
    totalHarvested,
    seedCost,
    revenue,
    profit,
    profitPerDay: Math.floor(
      profit / Math.max(SEASON_DAYS - plantingDay + 1, 1),
    ),
    firstHarvestDay,
  };
}

const formatGold = (value: number) => `${value.toLocaleString()}g`;

export default function ProfitabilityPage() {
  const { season, setSeason, colors } = useTheme();
  const seasonDetail = seasonDetails[season];
  const seasonCrops = useMemo(
    () => crops.filter((crop) => crop.season === season),
    [season],
  );
  const [plantingDay, setPlantingDay] = useState(1);
  const [plots, setPlots] = useState(9);
  const [selectedCropName, setSelectedCropName] = useState("");

  useEffect(() => {
    const savedDay = Number(localStorage.getItem("currentDay") || 1);
    setPlantingDay(Math.min(Math.max(savedDay || 1, 1), SEASON_DAYS));
  }, []);

  useEffect(() => {
    if (!seasonCrops.some((crop) => crop.name === selectedCropName))
      setSelectedCropName(seasonCrops[0]?.name ?? "");
  }, [seasonCrops, selectedCropName]);

  const rankedCrops = useMemo(
    () =>
      seasonCrops
        .map((crop) => ({
          ...crop,
          metrics: calculateMetrics(crop, plantingDay, plots),
        }))
        .sort((a, b) => b.metrics.profit - a.metrics.profit),
    [plantingDay, plots, seasonCrops],
  );
  const selectedCrop =
    seasonCrops.find((crop) => crop.name === selectedCropName) ??
    rankedCrops[0];
  const selectedMetrics = selectedCrop
    ? calculateMetrics(selectedCrop, plantingDay, plots)
    : null;
  const remainingDays = SEASON_DAYS - plantingDay + 1;

  return (
    <div className="pb-10">
      <div className="page-intro">
        <div>
          <p className="page-kicker">Plan your best harvest</p>
          <h1 className="page-title">Crop Profitability</h1>
          <p className="page-subtitle">
            Pick a planting day to see which crops can earn the most before the
            season ends.
          </p>
        </div>
        <span className="hidden rounded-full bg-season-soft px-3 py-1 text-xs font-bold text-season-primary sm:inline-flex">
          {season} • 30 days
        </span>
      </div>

      <div
        className={clsx(
          "mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm sm:p-5",
          seasonDetail.panel,
        )}
        style={{ borderColor: `${seasonDetail.accent}55` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm"
              style={{
                backgroundColor: seasonDetail.soft,
                color: seasonDetail.accent,
              }}
              aria-hidden="true"
            >
              {seasonDetail.icon}
            </span>
            <div>
              <p
                className="m-0 text-xs font-extrabold uppercase tracking-[0.16em]"
                style={{ color: seasonDetail.accent }}
              >
                {season} season
              </p>
              <p className="mt-1 text-sm text-[#5f6c62]">
                {seasonDetail.tagline}. See what you can still grow from day{" "}
                {plantingDay}.
              </p>
            </div>
          </div>
          <span
            className="hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex"
            style={{
              backgroundColor: seasonDetail.soft,
              color: seasonDetail.accent,
            }}
          >
            Day {plantingDay} → 30
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-season bg-white/70 p-3 shadow-sm">
        <div className="w-fit rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
          <select
            id="season"
            className={clsx(
              "cursor-pointer bg-transparent px-4 py-2 font-bold focus:outline-none",
              colors.text,
            )}
            value={season}
            onChange={(event) => setSeason(event.target.value as Season)}
          >
            {["Spring", "Summer", "Fall", "Winter"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <label
          className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-600"
          htmlFor="planting-day"
        >
          Planting day
          <input
            id="planting-day"
            type="number"
            min={1}
            max={SEASON_DAYS}
            value={plantingDay}
            onChange={(event) =>
              setPlantingDay(
                Math.min(
                  Math.max(Number(event.target.value) || 1, 1),
                  SEASON_DAYS,
                ),
              )
            }
            className="w-14 rounded-lg border border-stone-200 px-2 py-1 text-center font-bold text-[#315b45]"
          />
        </label>
        <span className="text-xs text-stone-400">
          This sets the estimate only; your calendar will not change.
        </span>
      </div>

      <section
        className="mb-6 rounded-2xl border border-[#e4d8c3] bg-[#fffdf8] p-4 shadow-md sm:p-5"
        aria-labelledby="top-crops-title"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="page-kicker">Season overview</p>
            <h2
              id="top-crops-title"
              className="m-0 font-serif text-2xl font-bold text-[#315b45]"
            >
              Best crops from day {plantingDay}
            </h2>
          </div>
          <span className="text-sm text-stone-500">Profit for 9 plots</span>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {rankedCrops.slice(0, 3).map((crop, index) => (
            <button
              type="button"
              key={crop.name}
              onClick={() => setSelectedCropName(crop.name)}
              className={clsx(
                "rounded-xl border p-3 text-left transition-colors hover:bg-[#f1f7ef]",
                selectedCropName === crop.name
                  ? "border-[#4f8061] bg-[#f1f7ef]"
                  : "border-[#eee5d5] bg-[#faf6ed]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#9a8a73]">
                  #{index + 1}
                </span>
                <span
                  className={clsx(
                    "font-bold",
                    crop.metrics.profit >= 0
                      ? "text-[#315b45]"
                      : "text-[#a34d3f]",
                  )}
                >
                  {formatGold(crop.metrics.profit)}
                </span>
              </div>
              <p className="mt-2 m-0 font-bold text-[#315b45]">{crop.name}</p>
              <p className="m-0 text-xs text-stone-500">
                {crop.metrics.harvests} harvest
                {crop.metrics.harvests === 1 ? "" : "s"} ·{" "}
                {crop.regrowth_time
                  ? `regrows every ${crop.regrowth_time}d`
                  : "single harvest"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section
        className="mb-6 rounded-2xl border border-[#b9d2b3] bg-[#f1f7ef] p-4 shadow-sm sm:p-5"
        aria-labelledby="calculator-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#4f8061]">
              Planting calculator
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2
                id="calculator-title"
                className="m-0 text-2xl font-bold text-[#315b45]"
              >
                Plan your {selectedCrop?.name ?? "crop"} field
              </h2>
              {selectedCrop && (
                <span
                  className={clsx(
                    "rounded-full px-2.5 py-1 text-xs font-bold",
                    selectedCrop.regrowth_time
                      ? "bg-[#dce9df] text-[#315b45]"
                      : "bg-[#f3e7c9] text-[#6d5427]",
                  )}
                >
                  {selectedCrop.regrowth_time
                    ? "↻ Regrowing crop"
                    : "✦ Single-harvest crop"}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6f806f]">
              {selectedCrop && selectedMetrics
                ? selectedMetrics.harvests
                  ? `${selectedMetrics.harvests} harvest${selectedMetrics.harvests === 1 ? "" : "s"} remain if planted on day ${plantingDay}.`
                  : `No harvests remain if planted on day ${plantingDay}.`
                : "Choose a crop to estimate remaining harvests."}
            </p>
          </div>
          <div className="flex gap-2">
            <label
              className="flex flex-col gap-1 text-xs font-bold text-[#4f8061]"
              htmlFor="crop-select"
            >
              Crop
              <select
                id="crop-select"
                value={selectedCrop?.name ?? ""}
                onChange={(event) => setSelectedCropName(event.target.value)}
                className="rounded-xl border border-[#b9d2b3] bg-white px-3 py-2 text-sm text-[#315b45] h-[38px]"
              >
                <option value="" disabled>
                  Select a crop
                </option>
                {seasonCrops.map((crop) => (
                  <option key={crop.name} value={crop.name}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="flex flex-col gap-1 text-xs font-bold text-[#4f8061]"
              htmlFor="plots"
            >
              Plots
              <input
                id="plots"
                type="number"
                min={1}
                value={plots}
                onChange={(event) =>
                  setPlots(Math.max(Number(event.target.value) || 1, 1))
                }
                className="w-20 rounded-xl border border-[#b9d2b3] bg-white px-3 py-2 text-sm text-[#315b45]"
              />
            </label>
          </div>
        </div>
        {selectedCrop && selectedMetrics && (
          <>
            <div className="mt-4 rounded-xl border border-[#d5e5d0] bg-white/60 px-3 py-2 text-sm text-[#5f6c62]">
              {selectedCrop.regrowth_time ? (
                <>
                  <span className="font-bold text-[#315b45]">Regrowing:</span>{" "}
                  buy seeds once; this crop can be harvested again every{" "}
                  {selectedCrop.regrowth_time} days.
                </>
              ) : (
                <>
                  <span className="font-bold text-[#6d5427]">
                    Single harvest:
                  </span>{" "}
                  replant and buy new seeds after each harvest that still fits
                  in the season.
                </>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl bg-white/80 p-3">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-stone-400">
                  First harvest
                </p>
                <p className="mt-1 text-lg font-bold text-[#315b45]">
                  {selectedMetrics.firstHarvestDay
                    ? `Day ${selectedMetrics.firstHarvestDay}`
                    : "None"}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-3">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-stone-400">
                  Harvests / plot
                </p>
                <p className="mt-1 text-lg font-bold text-[#315b45]">
                  {selectedMetrics.harvests}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-3">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-stone-400">
                  Seed cost
                </p>
                <p className="mt-1 text-lg font-bold text-[#315b45]">
                  {formatGold(selectedMetrics.seedCost)}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-3">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-stone-400">
                  Revenue
                </p>
                <p className="mt-1 text-lg font-bold text-[#315b45]">
                  {formatGold(selectedMetrics.revenue)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-stone-400">
                  Estimated profit
                </p>
                <p
                  className={clsx(
                    "mt-1 text-xl font-bold",
                    selectedMetrics.profit >= 0
                      ? "text-[#315b45]"
                      : "text-[#a34d3f]",
                  )}
                >
                  {selectedMetrics.profit >= 0 ? "+" : ""}
                  {formatGold(selectedMetrics.profit)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#5f6c62]">
              {selectedMetrics.harvests
                ? `${plots} plots produce ${selectedMetrics.totalHarvested} ${selectedCrop.name.toLowerCase()}${selectedMetrics.totalHarvested === 1 ? "" : "s"}.`
                : `No ${selectedCrop.name.toLowerCase()} harvest fits before the end of the season.`}{" "}
              Seed purchases are grouped as 1 purchase per 9 plots
              {selectedCrop.regrowth_time
                ? "; regrowing crops only need the initial purchase."
                : "; single-harvest crops need new seeds after each harvest."}
            </p>
          </>
        )}
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md"
        aria-labelledby="comparison-title"
      >
        <div className="border-b border-stone-200 bg-[#f7f0e3] p-4">
          <p className="page-kicker">Full comparison</p>
          <h2
            id="comparison-title"
            className="m-0 font-serif text-2xl font-bold text-[#315b45]"
          >
            Compare {season} crops from day {plantingDay}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100/50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3">Seed cost</th>
                <th className="px-4 py-3">Sell</th>
                <th className="px-4 py-3">Harvests / plot</th>
                <th className="px-4 py-3 text-right">Profit / 9 plots</th>
                <th className="px-4 py-3 text-right">Profit / day</th>
              </tr>
            </thead>
            <tbody>
              {rankedCrops.map((crop) => {
                const metrics = calculateMetrics(
                  crop,
                  plantingDay,
                  CROPS_PER_BAG,
                );
                return (
                  <tr
                    key={crop.name}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 font-bold text-stone-700">
                      {crop.name}
                      <span className="block text-xs font-normal text-stone-400">
                        {crop.regrowth_time
                          ? `Regrows every ${crop.regrowth_time}d`
                          : "Single harvest"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatGold(crop.seed_cost)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatGold(crop.sell_price)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {metrics.harvests}
                    </td>
                    <td
                      className={clsx(
                        "px-4 py-3 text-right font-bold",
                        metrics.profit >= 0 ? colors.primary : "text-[#a34d3f]",
                      )}
                    >
                      {formatGold(metrics.profit)}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-500">
                      {formatGold(metrics.profitPerDay)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-4 text-center text-xs italic text-stone-400">
        Estimates assume a 30-day season and one seed purchase for every 9
        plots. They do not include quality, processing, or other bonuses.
      </p>
    </div>
  );
}
