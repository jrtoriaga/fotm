import { useEffect, useState } from "react";
import type { ReferenceCrop, Season } from "../types/app-types";
import { getAllCrops } from "../lib/repo";
import clsx from "clsx";
import { useTheme } from "../context/ThemeContext";

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
    ]);

    getAllCrops().forEach((crop) => crops.get(crop.season)?.push(crop));

    setCrops(crops);
  }, []);

  return (
    <div className="mt-6 px-4 h-[calc(100vh-64px-24px)] overflow-hidden">
      <h3 className={clsx("mb-4 text-xl font-bold", colors.primary)}>
        Crop Almanac
      </h3>
      
      <div className="overflow-y-auto h-[calc(100vh-64px-80px)] pr-2 pb-10">
        <div className="flex flex-col gap-8">
          {stateCrops &&
            [...stateCrops.entries()].map(([key, value], i) => {
              if (!value || value.length === 0) return null;
              
              return (
                <div key={i} className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden">
                  <div className={clsx("px-4 py-2 font-bold text-lg border-b border-stone-100 bg-stone-50", colors.text)}>
                    {key}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-stone-500 uppercase bg-stone-50/50">
                        <tr>
                          <th className="px-4 py-2 font-medium">Name</th>
                          <th className="px-4 py-2 font-medium text-center">Harvest</th>
                          <th className="px-4 py-2 font-medium text-center">Regrow</th>
                          <th className="px-4 py-2 font-medium text-center">Seed</th>
                          <th className="px-4 py-2 font-medium text-center">Sell</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {value.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-stone-700">{item.name}</td>
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
