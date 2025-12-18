import clsx from "clsx";
import { useEffect, useState } from "react";
import { getAllCharacters } from "../lib/repo";
import type { Character, Season } from "../types/app-types";
import BirthdayModal from "../components/BirthdaysModal";
import { useTheme } from "../context/ThemeContext";

export default function BirthdayCalendarPage() {
  const { season, setSeason, colors } = useTheme();
  const [days, setDays] = useState<Map<number, Character[]>>(new Map());
  const [shown, setIsShown] = useState(false);
  const [activeBDay, setActiveBDay] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    setCurrentDay(Number(localStorage.getItem("currentDay") || 0));
  }, []);

  useEffect(() => {
    if (currentDay) {
      localStorage.setItem("currentDay", currentDay.toString());
    }
  }, [currentDay]);

  useEffect(() => {
    const arr = Array.from(
      { length: 30 },
      (_, i) => [i + 1, []] as [number, Character[]]
    );

    const newDays = new Map(arr);
    const characters = getAllCharacters(season);

    characters.forEach((character) =>
      newDays.get(character.birthday?.[1]!)?.push(character)
    );

    setDays(newDays);
  }, [season]);

  return (
    <div className="px-4 my-5 pb-10">
      <h3 className={clsx("mb-4 text-xl font-bold", colors.primary)}>
        Birthdays
      </h3>

      {/* Select */}
      <div className="mb-6 bg-white p-2 rounded-xl shadow-sm w-fit border border-stone-200">
        <select
          id="season"
          className={clsx(
            "py-2 px-4 bg-transparent font-bold focus:outline-none cursor-pointer",
            colors.text
          )}
          onChange={(e) => setSeason(e.target.value as Season)}
          value={season || ""}
        >
          {["Spring", "Summer", "Fall", "Winter"].map((s, i) => (
            <option value={s} key={i}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div className="flex flex-wrap bg-white rounded-xl shadow-md overflow-hidden border border-stone-200">
        {[...days.entries()].map(([day, events], i) => {
          const isFifth = (i + 1) % 5 === 0;
          const isLastRow = day >= 26;
          const hasEvents = events.length > 0;

          return (
            <div
              onClick={() => {
                if (hasEvents) {
                  setActiveBDay(day);
                  setIsShown(true);
                }
              }}
              className={clsx(
                "w-1/5 aspect-square text-xs flex flex-col gap-1 p-1 transition-colors",
                !isLastRow && "border-b border-stone-100",
                !isFifth && "border-r border-stone-100",
                hasEvents && "cursor-pointer hover:bg-stone-50"
              )}
              key={i}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentDay(day);
                }}
                className={clsx(
                  "relative flex items-center justify-center w-6 h-6 select-none rounded-full font-bold transition-all",
                  day === currentDay
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-stone-400"
                )}
              >
                {day}
              </span>

              {/* Birthdays */}
              {hasEvents && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {events.map((event, i) => (
                    <div
                      className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm",
                        colors.secondary,
                        colors.primary,
                        colors.accent
                      )}
                      key={`br-${i}`}
                      title={event.name}
                    >
                      {event.name[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={shown && activeBDay ? "block" : "hidden"}>
        <BirthdayModal
          setIsShown={setIsShown}
          characters={days.get(activeBDay)!}
        />
      </div>
    </div>
  );
}
