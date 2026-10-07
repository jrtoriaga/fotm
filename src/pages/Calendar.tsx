import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

import type { CalendarCrop, Crop } from "../types/app-types";
import AddCropFormModal from "../components/AddCropForm";
import { deleteAllCropsBySeason, deleteCropById, getAllCropsBySeason, saveCrop } from "../lib/db";
import { convertDBCrop, createCalendarCropFromRegrowing } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";
import { getAllCropsNames, getCropByName } from "../data/crops";

const seasonDetails = {
  Spring: {
    icon: "✿",
    tagline: "Fresh starts & tender shoots",
    accent: "#4f8061",
    soft: "#e5f0e3",
    marker: "#4f8061",
    panel: "from-[#f5fbf1] to-[#edf6e9]",
  },
  Summer: {
    icon: "☀",
    tagline: "Long days & generous growth",
    accent: "#b4772f",
    soft: "#fff0d6",
    marker: "#b4772f",
    panel: "from-[#fff9ed] to-[#fff1d8]",
  },
  Fall: {
    icon: "❧",
    tagline: "Golden days & final harvests",
    accent: "#a95d3b",
    soft: "#f8e5d9",
    marker: "#a95d3b",
    panel: "from-[#fff4eb] to-[#f8e5d9]",
  },
  Winter: {
    icon: "✧",
    tagline: "Rest, reflect & prepare",
    accent: "#55758c",
    soft: "#e4edf3",
    marker: "#55758c",
    panel: "from-[#f2f7fa] to-[#e3edf3]",
  },
} as const;

const cropColors: Record<string, { background: string; text: string; border: string }> = {
  Turnip: { background: "#f3e7c9", text: "#6d5427", border: "#d9bd7c" },
  Potato: { background: "#eee0c9", text: "#704d2a", border: "#d7b98c" },
  Cucumber: { background: "#dfead7", text: "#315b45", border: "#a9c49a" },
  Cabbage: { background: "#dce9df", text: "#315b45", border: "#a9c5b0" },
  Strawberry: { background: "#f3dede", text: "#843b45", border: "#d9aab1" },
  Onion: { background: "#eee2ef", text: "#694c70", border: "#cdb2d2" },
  Tomato: { background: "#f4d8d0", text: "#843b31", border: "#d9a69a" },
  Corn: { background: "#f4edc9", text: "#756329", border: "#ddcf8b" },
  Pineapple: { background: "#f6e4bd", text: "#76521f", border: "#dfbd75" },
  Pumpkin: { background: "#f3ddc9", text: "#874b2d", border: "#d6aa8a" },
  Carrot: { background: "#f3dec9", text: "#874b2d", border: "#d9ad87" },
  Eggplant: { background: "#e6dced", text: "#604675", border: "#c2acd0" },
  "Sweet Potato": { background: "#eedbcf", text: "#75432e", border: "#d4ad95" },
  "Green Pepper": { background: "#dce9d7", text: "#315b45", border: "#a8c49e" },
  Spinach: { background: "#d7e7d8", text: "#2f5b3a", border: "#9fbea3" },
};

const defaultCropColor = { background: "#eee6d8", text: "#5f513e", border: "#cfbea2" };

function getCropColor(crop: CalendarCrop) {
  return cropColors[crop.name] ?? defaultCropColor;
}

function CropInspectionModal({
  day,
  crops,
  season,
  onClose,
  onDelete,
  refreshCalendar,
}: {
  day: number;
  crops: CalendarCrop[];
  season: keyof typeof seasonDetails;
  onClose: () => void;
  onDelete: (crop: CalendarCrop) => Promise<void>;
  refreshCalendar: () => Promise<void>;
}) {
  const [activeCrop, setActiveCrop] = useState<CalendarCrop | null>(crops[0] ?? null);
  const [cropToDelete, setCropToDelete] = useState<CalendarCrop | null>(null);
  const [showPlantingCard, setShowPlantingCard] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("");

  const uniqueCrops = crops.filter(
    (crop, index, allCrops) =>
      allCrops.findIndex((candidate) => candidate.id === crop.id && candidate.name === crop.name) === index
  );
  const activeReference = activeCrop ? getCropByName(activeCrop.name) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="crop-inspection-title">
      <button className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" aria-label="Close crop inspection" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#ddcfb4] bg-[#fffaf0] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e4d8c3] bg-[#f7f0e3] p-4">
          <div>
            <p className="page-kicker">Field notes</p>
            <h2 id="crop-inspection-title" className="m-0 font-serif text-2xl font-bold text-[#203f32]">Crops on day {day}</h2>
          </div>
          <button onClick={onClose} aria-label="Close crop inspection" className="rounded-full p-2 text-xl text-[#9a8a73] transition-colors hover:bg-[#eadfcd] hover:text-[#5f513e]">×</button>
        </div>

        <div className="border-b border-stone-100 bg-[#f8f3e8] px-4 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#b9d2b3] bg-white px-3 py-2 text-sm font-bold text-[#315b45] shadow-sm transition-colors hover:bg-[#f1f7ef]"
            aria-expanded={showPlantingCard}
            aria-controls="field-notes-planting-card"
            onClick={() => setShowPlantingCard((visible) => !visible)}
          >
            <span aria-hidden="true">{showPlantingCard ? "−" : "✦"}</span>
            {showPlantingCard ? "Hide planting card" : "Plant a crop"}
          </button>
        </div>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {showPlantingCard && (
            <section id="field-notes-planting-card" className="rounded-xl border border-[#b9d2b3] bg-[#f1f7ef] p-4 shadow-sm md:col-span-2" aria-labelledby="field-notes-planting-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#4f8061]">New field note</p>
                  <h3 id="field-notes-planting-title" className="m-0 text-lg font-bold text-[#315b45]">Plant a crop on day {day}</h3>
                    <p className="m-0 text-sm text-[#9a8a73]">No planting or harvest notes for this day.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#315b45]">Day {day}</span>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <label htmlFor="field-notes-crop" className="text-xs font-bold text-stone-600">{season} crops</label>
                  <select
                    id="field-notes-crop"
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3"
                    value={selectedCrop}
                    onChange={(event) => setSelectedCrop(event.target.value)}
                  >
                    <option value="">Select a crop</option>
                    {getAllCropsNames(season).map((crop) => <option key={crop} value={crop}>{crop}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-[#315b45] px-4 py-3 font-bold text-[#fffaf0] shadow-sm transition-colors hover:bg-[#203f32] disabled:cursor-not-allowed disabled:bg-[#b8b2a4]"
                  disabled={!selectedCrop}
                  onClick={async () => {
                    await saveCrop({ name: selectedCrop, plantedDate: day });
                    await refreshCalendar();
                    setSelectedCrop("");
                  }}
                >
                  <span aria-hidden="true">✦</span> Plant Crop
                </button>
              </div>
            </section>
          )}
          <section className="rounded-xl border border-[#e4d8c3] bg-[#fffdf8] p-4 shadow-sm" aria-labelledby="planted-crops-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a8a73]">Day {day}</p>
                <h3 id="planted-crops-title" className="m-0 text-lg font-bold text-[#315b45]">Crops on this day</h3>
              </div>
              <span className="rounded-full bg-[#e5f0e3] px-2.5 py-1 text-xs font-bold text-[#315b45]">{uniqueCrops.length}</span>
            </div>
            {uniqueCrops.length ? (
              <div className="flex flex-col gap-2">
                {uniqueCrops.map((crop) => (
                    <div key={`${crop.id}-${crop.name}`} className={clsx("flex items-center gap-2 rounded-lg border p-2", activeCrop?.id === crop.id && activeCrop?.name === crop.name ? "border-[#4f8061] bg-[#f1f7ef]" : "border-[#eee5d5] bg-[#faf6ed]")}>
                    <button className="min-w-0 flex-1 truncate rounded px-1 text-left font-bold text-[#315b45] hover:text-[#203f32]" onClick={() => setActiveCrop(crop)} title={`View ${crop.name} information`}>
                      {crop.name}
                    </button>
                    <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[#a34d3f] transition-colors hover:bg-[#f8e5e0]" onClick={() => setCropToDelete(crop)} aria-label={`Delete ${crop.name}`} title={`Delete ${crop.name}`}>×</button>
                  </div>
                ))}
              </div>
            ) : <p className="m-0 py-8 text-center text-sm text-stone-400">No crops are planted or harvested on this day.</p>}
          </section>

          <section className="rounded-xl border border-[#e4d8c3] bg-[#fffdf8] p-4 shadow-sm" aria-labelledby="crop-info-title">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a8a73]">Crop details</p>
            {activeCrop && activeReference ? (
              <>
                <h3 id="crop-info-title" className="mt-1 text-2xl font-bold text-[#315b45]">{activeCrop.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{activeReference.season} crop · planted on day {activeCrop.plantedDate || "—"}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-[#f5efe2] p-3"><dt className="text-xs font-bold uppercase tracking-wider text-stone-400">First harvest</dt><dd className="mt-1 font-bold text-[#315b45]">{activeReference.harvest_time} days</dd></div>
                  <div className="rounded-lg bg-[#f5efe2] p-3"><dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Regrows</dt><dd className="mt-1 font-bold text-[#315b45]">{activeReference.regrowth_time ? `Every ${activeReference.regrowth_time} days` : "Does not regrow"}</dd></div>
                  <div className="rounded-lg bg-[#f5efe2] p-3"><dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Seed cost</dt><dd className="mt-1 font-bold text-[#315b45]">{activeReference.seed_cost}g</dd></div>
                  <div className="rounded-lg bg-[#f5efe2] p-3"><dt className="text-xs font-bold uppercase tracking-wider text-stone-400">Sell price</dt><dd className="mt-1 font-bold text-[#315b45]">{activeReference.sell_price}g</dd></div>
                </dl>
              </>
            ) : <p className="mt-5 text-sm text-stone-400">Select a crop to see its information.</p>}
          </section>
        </div>
      </div>

      {cropToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-crop-title">
          <div className="w-full max-w-sm rounded-2xl border border-[#e5c5a4] bg-[#fffaf0] p-5 shadow-2xl">
            <p className="page-kicker">Please confirm</p>
            <h2 id="delete-crop-title" className="m-0 text-xl font-bold text-[#843b31]">Delete {cropToDelete.name}?</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">This removes the crop from every planted and harvest date in the calendar.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border border-stone-200 px-4 py-2 font-bold text-stone-600 hover:bg-stone-100" onClick={() => setCropToDelete(null)}>Cancel</button>
              <button className="rounded-xl bg-[#a34d3f] px-4 py-2 font-bold text-white hover:bg-[#843b31]" onClick={async () => { await onDelete(cropToDelete); setCropToDelete(null); if (uniqueCrops.length <= 1) onClose(); }}>Delete crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarPage() {
  const { season, setSeason, colors } = useTheme();
  const seasonDetail = seasonDetails[season];
  
  // calendar obj
  const [showModal, setShowForm] = useState(false);

  // Update: Use Map for Calendar days for efficiency
  const [calendarDays, setCalendarDays] = useState<Map<number, CalendarCrop[]>>(
    new Map<number, CalendarCrop[]>()
  );

  // Feat: Highlight day
  const [currentDay, setCurrentDay] = useState(0);

  const [inspectionDay, setInspectionDay] = useState<number | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

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
      <div className="pb-10">
        <div className="page-intro">
          <div><p className="page-kicker">Your farm, at a glance</p><h1 className="page-title">Crop Calendar</h1><p className="page-subtitle">Plan plantings and harvests across a 30-day season.</p></div>
          <span className="hidden sm:inline-flex rounded-full bg-season-soft px-3 py-1 text-xs font-bold text-season-primary">{season} • 30 days</span>
        </div>

        <div
          className={clsx(
            "mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm sm:p-5",
            seasonDetail.panel
          )}
          style={{ borderColor: `${seasonDetail.accent}55` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm"
                style={{ backgroundColor: seasonDetail.soft, color: seasonDetail.accent }}
                aria-hidden="true"
              >
                {seasonDetail.icon}
              </span>
              <div>
                <p className="m-0 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: seasonDetail.accent }}>
                  {season} season
                </p>
                <p className="mt-1 text-sm text-[#5f6c62]">{seasonDetail.tagline}. Your calendar is showing {season.toLowerCase()} crops only.</p>
              </div>
            </div>
            <span className="hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex" style={{ backgroundColor: seasonDetail.soft, color: seasonDetail.accent }}>
              30 days
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-season bg-white/70 p-3 shadow-sm">
          {/* Season select */}
          <div className="bg-white p-2 rounded-xl shadow-sm w-fit border border-stone-200">
            <select
              id="season"
              className={clsx(
                "py-2 px-4 bg-transparent font-bold focus:outline-none cursor-pointer",
                colors.text
              )}
              onChange={(e) => setSeason(e.target.value as "Spring" | "Summer" | "Fall" | "Winter")}
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
            onClick={() => season !== "Winter" && setShowForm(true)}
            className={clsx(
              "rounded-xl px-4 py-3 font-bold text-[#fffaf0] shadow-sm transition-all",
              season === "Winter"
                ? "cursor-not-allowed bg-stone-300 opacity-70"
                : "bg-[#315b45] hover:bg-[#203f32]"
            )}
            disabled={season === "Winter"}
            title={season === "Winter" ? "There are no crops to plant in Winter" : "Plant a crop"}
          >
            <span aria-hidden="true">{season === "Winter" ? "✧" : "✚"}</span>{" "}
            {season === "Winter" ? "No Winter Crops" : "Plant Crop"}
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirmation(true)}
            className="rounded-xl border border-[#e5c5a4] bg-[#fffaf0] px-4 py-3 font-bold text-[#843b31] shadow-sm transition-all hover:bg-[#f8e5e0]"
            title={`Reset the ${season} calendar`}
          >
            <span aria-hidden="true">↺</span> Reset Calendar
          </button>

        </div>

        {/* Calendar */}
        <div className="flex flex-wrap overflow-hidden rounded-2xl border border-[#dfd2bd] bg-[#fffdf8] p-2 shadow-md sm:p-3">
          {calendarDays &&
            [...calendarDays.entries()].map(([day, crops], i) => {
              const isFifth = (i + 1) % 5 === 0;
              const isLastRow = day >= 26;
              return (
                <div
                  className={clsx(
                    "w-1/5 aspect-square min-w-0 text-xs flex flex-col gap-1 rounded-lg p-1.5 transition-colors hover:bg-[#f4ecdd] sm:p-2",
                    !isLastRow && "border-b border-[#eadfce]",
                    !isFifth && "border-r border-[#eadfce]"
                  )}
                  key={i}
                  onClick={() => setCurrentDay(day)}
                  onDoubleClick={() => setInspectionDay(day)}
                >
                  <span
                    className={clsx(
                      "relative flex items-center justify-center w-6 h-6 select-none rounded-full font-bold transition-all cursor-pointer",
                      day === currentDay
                        ? "bg-red-500 text-white shadow-sm ring-2 ring-offset-1"
                        : "text-stone-400"
                    )}
                    style={day === currentDay ? { backgroundColor: seasonDetail.marker, boxShadow: `0 0 0 2px ${seasonDetail.soft}` } : undefined}
                  >
                    {day}
                  </span>
                  
                  {/* crop list */}
                  <div className="w-full flex flex-col overflow-y-auto gap-1 h-full">
                    {crops &&
                      crops.map((crop, i) => {
                        const cropColor = getCropColor(crop);
                        const isPlanting = crop.plantedDate === day;
                        return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionDay(day);
                          }}
                          className={clsx(
                            "truncate rounded border px-1.5 py-0.5 text-left text-[10px] transition-colors hover:brightness-95",
                            isPlanting ? "font-extrabold" : "font-medium",
                          )}
                          style={{
                            backgroundColor: cropColor.background,
                            color: cropColor.text,
                            borderColor: cropColor.border,
                            borderLeftWidth: isPlanting ? 3 : 1,
                            borderLeftStyle: "solid",
                          }}
                          key={i}
                          title={isPlanting ? `Planting: ${crop.name}` : `Regrowth harvest: ${crop.name}`}
                        >
                          <span aria-hidden="true">{isPlanting ? "✦" : "↻"}</span>{" "}{crop.name}
                        </button>
                        );
                      })}
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
        showModal={showModal && season !== "Winter"}
      />
      {inspectionDay !== null && (
        <CropInspectionModal
          day={inspectionDay}
          crops={calendarDays.get(inspectionDay) ?? []}
          season={season}
          onClose={() => setInspectionDay(null)}
          refreshCalendar={refreshCalendar}
          onDelete={async (crop) => {
            if (crop.id !== undefined) {
              await deleteCropById(crop.id);
              await refreshCalendar();
            }
          }}
        />
      )}
      {showResetConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="alertdialog" aria-modal="true" aria-labelledby="reset-calendar-title">
          <div className="w-full max-w-sm rounded-2xl border border-[#e5c5a4] bg-[#fffaf0] p-5 shadow-2xl">
            <p className="page-kicker">Please confirm</p>
            <h2 id="reset-calendar-title" className="m-0 text-xl font-bold text-[#843b31]">Reset {season} calendar?</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">This removes all planted crops and field notes from the {season} season calendar. Other season calendars will not be changed.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl border border-stone-200 px-4 py-2 font-bold text-stone-600 hover:bg-stone-100" onClick={() => setShowResetConfirmation(false)}>Cancel</button>
              <button type="button" className="rounded-xl bg-[#a34d3f] px-4 py-2 font-bold text-white hover:bg-[#843b31]" onClick={async () => { await deleteAllCropsBySeason(season); await refreshCalendar(); setShowResetConfirmation(false); }}>Reset calendar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarPage;
