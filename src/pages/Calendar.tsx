import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

import type { CalendarCrop, Crop } from "../types/app-types";
import AddCropFormModal from "../components/AddCropForm";
import { deleteCropById, getAllCropsBySeason } from "../lib/db";
import { convertDBCrop, createCalendarCropFromRegrowing } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";

function CalendarPage() {
  const { season, setSeason, colors } = useTheme();
  
  // calendar obj
  const [showModal, setShowForm] = useState(false);

  // Update: Use Map for Calendar days for efficiency
  const [calendarDays, setCalendarDays] = useState<Map<number, CalendarCrop[]>>(
    new Map<number, CalendarCrop[]>()
  );

  // Feat: Highlight day
  const [currentDay, setCurrentDay] = useState(0);

  // TODO: Create a better and less confusing way to delete a crop
  const [selectedCrop, setSelectedCrop] = useState(0);

  // Populate initial calendar on load
  useEffect(() => {
    setEmptyCalendar();

    // Feat: Hightlight day
    setCurrentDay(Number(localStorage.getItem("currentDay") || 0));
  }, []);

  // Feat: Highlight day
  useEffect(() => {
    if (currentDay) {
      localStorage.setItem("currentDay", currentDay.toString());
    }
  }, [currentDay]);

  // Refresh the calendar if season's changed
  useEffect(() => {
    (async () => {
      await refreshCalendar();
    })();
  }, [season]);

  // A handy function to empty the calendar
  const setEmptyCalendar = useCallback(() => {
    const newDays = Array.from(
      { length: 30 },
      (_, i) => [i + 1, []] as [number, CalendarCrop[]]
    );
    setCalendarDays(new Map(newDays));
  }, []);

  // A handy function to refresh the calendar
  const refreshCalendar = useCallback(async () => {
    if (!season) {
      setEmptyCalendar();
      return;
    }
    console.log("Refreshing calendar");

    const newDays = new Map(
      Array.from(
        { length: 30 },
        (_, i) => [i + 1, []] as [number, CalendarCrop[]]
      )
    );
    const dbCrops = await getAllCropsBySeason(season);

    if (dbCrops) {
      // split these crops
      const singleHarvestCrops: Crop[] = [];
      const regrowingCrops: Crop[] = [];

      dbCrops.forEach((crop) => {
        if (crop.regrowthTime) {
          regrowingCrops.push(crop);
        } else {
          singleHarvestCrops.push(crop);
        }
      });

      const crops: CalendarCrop[] = [];

      singleHarvestCrops.forEach((crop) => crops.push(convertDBCrop(crop)));
      regrowingCrops.forEach((crop) =>
        crops.push(...createCalendarCropFromRegrowing(crop))
      );

      crops.forEach((crop) => {
        // WARN: Ensure the harvest date are properly formatted. For example, 1-30
        newDays.get(crop.harvestDate)?.push(crop);
        newDays.get(crop.plantedDate)?.push(crop);
      });

      setCalendarDays(newDays);
    }
  }, [season]);

  return (
    <>
      <div className="px-4 my-5 pb-10">
        <h3 className={clsx("mb-4 text-xl font-bold", colors.primary)}>
          Crop Calendar
        </h3>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Season select */}
          <div className="bg-white p-2 rounded-xl shadow-sm w-fit border border-stone-200">
            <select
              id="season"
              className={clsx(
                "py-2 px-4 bg-transparent font-bold focus:outline-none cursor-pointer",
                colors.text
              )}
              onChange={(e) => setSeason(e.target.value as any)}
              value={season}
            >
              {["Spring", "Summer", "Fall", "Winter"].map((s, i) => (
                <option value={s} key={i}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/*  Add crop button */}
          <button
            onClick={() => setShowForm(true)}
            className={clsx(
              "px-4 py-3 rounded-xl font-bold text-white shadow-sm transition-transform active:scale-95",
              "bg-green-600 hover:bg-green-700"
            )}
          >
            Plant Crop
          </button>

          {/*  Delete crop button */}
          <button
            onClick={() =>
              deleteCropById(selectedCrop).then(() => {
                refreshCalendar();
                setSelectedCrop(0);
              })
            }
            className={clsx(
              "px-4 py-3 rounded-xl font-bold text-white shadow-sm transition-all active:scale-95",
              selectedCrop 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-stone-300 cursor-not-allowed opacity-50"
            )}
            disabled={!selectedCrop}
          >
            Delete Selected
          </button>
        </div>

        {/* Calendar */}
        <div className="flex flex-wrap bg-white rounded-xl shadow-md overflow-hidden border border-stone-200">
          {calendarDays &&
            [...calendarDays.entries()].map(([day, crops], i) => {
              const isFifth = (i + 1) % 5 === 0;
              const isLastRow = day >= 26;
              return (
                <div
                  className={clsx(
                    "w-1/5 aspect-square text-xs flex flex-col gap-1 p-1 transition-colors hover:bg-stone-50",
                    !isLastRow && "border-b border-stone-100",
                    !isFifth && "border-r border-stone-100"
                  )}
                  key={i}
                  onClick={() => setCurrentDay(day)}
                >
                  <span
                    className={clsx(
                      "relative flex items-center justify-center w-6 h-6 select-none rounded-full font-bold transition-all cursor-pointer",
                      day === currentDay
                        ? "bg-red-500 text-white shadow-sm"
                        : "text-stone-400"
                    )}
                  >
                    {day}
                  </span>
                  
                  {/* crop list */}
                  <div className="w-full flex flex-col overflow-y-auto gap-1 h-full">
                    {crops &&
                      crops.map((crop, i) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedCrop === crop.id) {
                              setSelectedCrop(0);
                            } else setSelectedCrop(crop.id!);
                          }}
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium text-left truncate transition-colors border border-transparent",
                            crop.plantedDate === day && "bg-lime-100 text-lime-800",
                            crop.harvestDate === day && "bg-amber-100 text-amber-800",
                            selectedCrop === crop.id && "!bg-red-500 !text-white shadow-sm !border-red-600"
                          )}
                          key={i}
                          title={crop.name}
                        >
                          {crop.name}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <AddCropFormModal
        season={season}
        hideForm={() => setShowForm(false)}
        refreshCalendar={refreshCalendar}
        currentDay={currentDay}
        showModal={showModal}
      />
    </>
  );
}

export default CalendarPage;
