import crops from "../data/crops";
import { Season } from "../types/app-types";
import clsx from "clsx";
import { useTheme } from "../context/ThemeContext";

export default function ProfitabilityPage() {
  const { season, setSeason, colors } = useTheme();
  const SEASON_DAYS = 30;
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
  const sortedCrops = filteredCrops
    .map((c) => ({ ...c, ...calculateMetrics(c) }))
    .sort((a, b) => b.profit - a.profit);

  return (
    <div className="p-4 h-[calc(100vh-64px)] overflow-scroll">
      <h3 className={clsx("mb-4 text-xl font-bold", colors.primary)}>
        Crop Profitability
      </h3>

      {/* Season Selector */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm w-fit border border-stone-200">
        {(["Spring", "Summer", "Fall"] as Season[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              season === s
                ? `${colors.secondary} ${colors.primary} shadow-sm`
                : "text-stone-400 hover:bg-stone-100"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl shadow-md border border-stone-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-stone-500 uppercase bg-stone-100/50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3">Crop</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Sell</th>
              <th className="px-4 py-3">Harvests</th>
              <th className="px-4 py-3 text-right">Season Profit</th>
              <th className="px-4 py-3 text-right">Gold/Day</th>
            </tr>
          </thead>
          <tbody>
            {sortedCrops.map((crop) => (
              <tr
                key={crop.name}
                className="bg-white border-b border-stone-100 hover:bg-stone-50 transition-colors last:border-0"
              >
                <td className="px-4 py-3 font-bold text-stone-700">
                  {crop.name}
                  {crop.regrowth_time && (
                    <span className="text-xs font-normal text-stone-400 block">
                      Regrows: {crop.regrowth_time}d
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600">{crop.seed_cost}g</td>
                <td className="px-4 py-3 text-stone-600">{crop.sell_price}g</td>
                <td className="px-4 py-3 text-stone-600">{crop.harvests}</td>
                <td className={clsx("px-4 py-3 text-right font-bold", colors.primary)}>
                  {crop.profit.toLocaleString()}g
                </td>
                <td className="px-4 py-3 text-right text-stone-500">
                  {crop.goldPerDay}g
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <p className="text-xs text-stone-400 mt-4 text-center italic">
          *Calculations assume a 30-day season and 1 seed bag yielding 9 crops.
        </p>
    </div>
  );
}
