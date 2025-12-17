import { useState } from "react";
import crops from "../data/crops";
import { Season } from "../types/app-types";
import clsx from "clsx";

export default function ProfitabilityPage() {
  const [season, setSeason] = useState<Season>("Spring");
  const SEASON_DAYS = 28;
  const CROPS_PER_BAG = 9;

  const filteredCrops = crops.filter((crop) => crop.season === season);

  const calculateMetrics = (crop: typeof crops[0]) => {
    let harvests = 0;
    let seedBags = 0;

    if (crop.regrowth_time) {
      // Regrowth crops: Buy 1 bag, harvest multiple times
      seedBags = 1;
      let day = crop.harvest_time;
      while (day <= SEASON_DAYS) {
        harvests++;
        day += crop.regrowth_time;
      }
    } else {
      // Single harvest: Replant after every harvest
      // Max cycles fit into the season
      const cycles = Math.floor(SEASON_DAYS / crop.harvest_time);
      harvests = cycles;
      seedBags = cycles;
    }

    const totalRevenue = harvests * CROPS_PER_BAG * crop.sell_price;
    const totalCost = seedBags * crop.seed_cost;
    const profit = totalRevenue - totalCost;
    const goldPerDay = Math.floor(profit / SEASON_DAYS);

    return { harvests, profit, goldPerDay };
  };

  // Sort by profit descending
  const sortedCrops = filteredCrops.map(c => ({...c, ...calculateMetrics(c)})).sort((a, b) => b.profit - a.profit);

  return (
    <div className="p-4 h-[calc(100vh-64px)] overflow-scroll">
      <h3 className="mb-4 text-md font-semibold">Crop Profitability</h3>

      {/* Season Selector */}
      <div className="flex gap-2 mb-6">
        {(["Spring", "Summer", "Fall"] as Season[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={clsx(
              "px-4 py-2 rounded text-sm font-medium transition-colors",
              season === s
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Crop</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Sell</th>
              <th className="px-4 py-3">Harvests</th>
              <th className="px-4 py-3 text-right">Season Profit (3x3)</th>
              <th className="px-4 py-3 text-right">Gold/Day</th>
            </tr>
          </thead>
          <tbody>
            {sortedCrops.map((crop) => (
              <tr key={crop.name} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {crop.name}
                  {crop.regrowth_time && <span className="text-xs text-gray-500 block">Regrows: {crop.regrowth_time}d</span>}
                </td>
                <td className="px-4 py-3">{crop.seed_cost}g</td>
                <td className="px-4 py-3">{crop.sell_price}g</td>
                <td className="px-4 py-3">{crop.harvests}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  {crop.profit.toLocaleString()}g
                </td>
                <td className="px-4 py-3 text-right">
                  {crop.goldPerDay}g
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4 text-center">
          *Calculations assume a 28-day season and 1 seed bag yielding 9 crops.
        </p>
      </div>
    </div>
  );
}
