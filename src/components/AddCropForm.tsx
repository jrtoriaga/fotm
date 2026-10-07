import { useEffect, useState } from "react";
import { getAllCropsNames } from "../data/crops";
import { saveCrop } from "../lib/db";
import type { Season } from "../types/app-types";

export default function AddCropFormModal({
  season,
  hideForm,
  refreshCalendar: onFinish,
  currentDay,
  showModal
}: {
  season: Season;
  currentDay?: number,
  hideForm: () => void,
  showModal: boolean,
  refreshCalendar: () => Promise<void>,
}) {
  const [crops, setCrops] = useState<string[]>([]);

  const [selectedCrop, setSelectedCrop] = useState("");
  const [plantedDay, setPlantedDay] = useState(1);

  useEffect(() => {
    setCrops(getAllCropsNames(season));
  }, [season]);


  // Avoids necessary re computing of season by splitting it to this
  useEffect(() => {
    if (currentDay){
      setPlantedDay(currentDay)
    }
  }, [currentDay])

  // Only show null but keep this components computation
  if (!showModal){
    return null
  }

  const plantCrop = async () => {

    if (!selectedCrop){
        return
    }

    await saveCrop({name: selectedCrop, plantedDate: plantedDay})
    console.log('Saved')
    await onFinish()

    setSelectedCrop("")
    setPlantedDay(1)
    hideForm()
  }

  return (
    <div className="w-screen fixed top-0 left-0 flex justify-center">
      <div className="absolute w-screen h-screen top-0 left-0 bg-black opacity-50" onClick={hideForm}></div>

      <div className="z-10 mt-[15vh] flex w-[min(92vw,500px)] flex-col gap-4 overflow-hidden rounded-2xl border border-[#ddcfb4] bg-[#fffaf0] p-5 shadow-2xl">
        <div><p className="page-kicker">New field note</p><h2 className="m-0 font-serif text-2xl font-bold text-[#203f32]">Planting in {season}</h2></div>

        {/* Crop input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="crops" className="text-xs">
            {season} crops
          </label>
          <select
            className="px-4 py-3"
            id="crops"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            <option value="">Select a crop</option>
            {crops.map((crop, i) => (
              <option key={i} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div className="flex flex-col gap-2">
          <label htmlFor="plantedDay" className="text-xs">
            Day (1-30)
          </label>
          <select
            className="px-4 py-3"
            id="plantedDay"
            value={plantedDay}
            onChange={(e) => setPlantedDay(Number(e.target.value))}
          >
            {[...Array(30)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Plant */}
        <button className="rounded-xl bg-[#315b45] px-4 py-3 font-bold text-[#fffaf0] shadow-sm hover:bg-[#203f32] disabled:cursor-not-allowed disabled:bg-[#b8b2a4]" onClick={plantCrop} disabled={!selectedCrop}><span aria-hidden="true">✦</span> Plant Crop</button>
      </div>
    </div>
  );
}
