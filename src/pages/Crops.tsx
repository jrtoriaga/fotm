import { useEffect, useState } from "react";
import type { ReferenceCrop, Season } from "../types/app-types";
import { getAllCrops } from "../lib/repo";
import clsx from "clsx";
import { useTheme } from "../context/ThemeContext";

const seasonDetails = {
  Spring: { icon: "✿", accent: "#4f8061", soft: "#e5f0e3", panel: "from-[#f5fbf1] to-[#edf6e9]" },
  Summer: { icon: "☀", accent: "#b4772f", soft: "#fff0d6", panel: "from-[#fff9ed] to-[#fff1d8]" },
  Fall: { icon: "❧", accent: "#a95d3b", soft: "#f8e5d9", panel: "from-[#fff4eb] to-[#f8e5d9]" },
  Winter: { icon: "✧", accent: "#55758c", soft: "#e4edf3", panel: "from-[#f2f7fa] to-[#e3edf3]" },
} as const;

export default function CropsPage() {
  const { colors } = useTheme();
  const [stateCrops, setCrops] = useState<Map<Season, ReferenceCrop[]>>(
    new Map()
  );

  // Get all crops
  useEffect(() => {
    const crops = new Map<Season, ReferenceCrop[]>([
      ["Spring", []],
      ["Summer", []],
      ["Fall", []],
      ["Winter", []],
    ]);

    getAllCrops().forEach((crop) => crops.get(crop.season)?.push(crop));

    setCrops(crops);
  }, []);

  return (
    <div className="pb-10">
      <div className="page-intro"><div><p className="page-kicker">Seeds, seasons & sell prices</p><h1 className="page-title">Crop Almanac</h1><p className="page-subtitle">A tidy reference for every crop in Mineral Town.</p></div></div>
      
      <div className="overflow-y-auto pr-2">
        <div className="flex flex-col gap-5">
          {stateCrops &&
            [...stateCrops.entries()].map(([key, value], i) => {
              if (!value || value.length === 0) return null;
              
              return (
                <div key={i} data-season={key} className="overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm" style={{ borderColor: `${seasonDetails[key].accent}55` }}>
                  <div className="flex items-center gap-3 border-b border-[#e4d8c3] bg-[#f7f0e3] px-4 py-3">
                    <div>
                      <h2 className={clsx("m-0 text-xl font-bold", colors.text)}>{key}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-sm" style={{ backgroundColor: seasonDetails[key].soft, color: seasonDetails[key].accent }} aria-hidden="true">
                        {seasonDetails[key].icon}
                      </span>
                      <p className="m-0 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: seasonDetails[key].accent }}>Growing season</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-[#e4d8c3] bg-[#efe6d3] text-xs uppercase text-[#6c604d]">
                        <tr>
                          <th className="px-4 py-3 font-bold">Name</th>
                          <th className="px-4 py-3 text-center font-bold">Harvest</th>
                          <th className="px-4 py-3 text-center font-bold">Regrow</th>
                          <th className="px-4 py-3 text-center font-bold">Seed</th>
                          <th className="px-4 py-3 text-center font-bold">Sell</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eee5d5]">
                        {value.map((item, idx) => (
                          <tr key={idx} className="bg-[#fffdf8] transition-colors hover:bg-[#f5eedf]">
                            <td className="px-4 py-3 font-bold text-[#315b45]">{item.name}</td>
                            <td className="px-4 py-3 text-center text-stone-600">{item.harvest_time}d</td>
                            <td className="px-4 py-3 text-center text-stone-600">
                              {item.regrowth_time ? `${item.regrowth_time}d` : "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-stone-600">{item.seed_cost}g</td>
                            <td className="px-4 py-3 text-center text-stone-600">{item.sell_price}g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
