import clsx from "clsx";
import { useEffect, useState } from "react";
import { getAllCharacters } from "../lib/repo";
import type { Character, Season } from "../types/app-types";
import CharacterModal from "../components/CharacterModal";
import { useTheme } from "../context/ThemeContext";

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

export default function BirthdayCalendarPage() {
  const { season, setSeason, colors } = useTheme();
  const seasonDetail = seasonDetails[season];
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
    <div className="pb-10">
      <div className="page-intro">
        <div><p className="page-kicker">Keep the town smiling</p><h1 className="page-title">Birthdays</h1><p className="page-subtitle">Never miss a neighbor’s special day.</p></div>
        <span className="hidden rounded-full bg-season-soft px-3 py-1 text-xs font-bold text-season-primary sm:inline-flex">{season} • 30 days</span>
      </div>

      <div
        className={clsx("mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm sm:p-5", seasonDetail.panel)}
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
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: seasonDetail.accent }}>{season} season</p>
              <p className="mt-1 text-sm text-[#5f6c62]">{seasonDetail.tagline}. Browse birthdays for {season.toLowerCase()} neighbors.</p>
            </div>
          </div>
          <span className="hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex" style={{ backgroundColor: seasonDetail.soft, color: seasonDetail.accent }}>30 days</span>
        </div>
      </div>

      {/* Select */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-season bg-white/70 p-3 shadow-sm">
        <div className="w-fit rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
          <select
            id="season"
            className={clsx("cursor-pointer bg-transparent px-4 py-2 font-bold focus:outline-none", colors.text)}
            onChange={(e) => setSeason(e.target.value as Season)}
            value={season || ""}
          >
            {["Spring", "Summer", "Fall", "Winter"].map((s, i) => (
              <option value={s} key={i}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex flex-wrap overflow-hidden rounded-2xl border border-[#dfd2bd] bg-white p-2 shadow-md sm:p-3">
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
                "w-1/5 aspect-square min-w-0 text-xs flex flex-col gap-1 rounded-lg p-1.5 transition-colors sm:p-2",
                !isLastRow && "border-b border-[#eadfce]",
                !isFifth && "border-r border-[#eadfce]",
                hasEvents && "cursor-pointer hover:bg-[#f4ecdd]"
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
                style={day === currentDay ? { backgroundColor: seasonDetail.marker, boxShadow: `0 0 0 2px ${seasonDetail.soft}` } : undefined}
              >
                {day}
              </span>

              {/* Birthdays */}
              {hasEvents && (
                <div className="flex flex-wrap justify-center gap-1">
                  {events.map((event, i) => (
                    <div
                      className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm",
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

      <CharacterModal
        isOpen={shown}
        onClose={() => setIsShown(false)}
        characters={days.get(activeBDay) || []}
        title="Birthdays"
      />
    </div>
  );
}
