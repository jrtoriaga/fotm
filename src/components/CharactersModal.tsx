import clsx from "clsx";
import { useTheme } from "../context/ThemeContext";
import type { Character } from "../types/app-types";

export default function CharactersModal({
  isShown,
  setShown,
  character

}: {
  isShown: boolean;
  setShown: (shown: boolean) => void;
  character?: Character
}) {
  const { colors } = useTheme();

  if (!isShown || !character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setShown(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/50">
          <h3 className={clsx("text-lg font-bold", colors.primary)}>
            Character Details
          </h3>
          <button
            onClick={() => setShown(false)}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={clsx(
              "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border shadow-sm shrink-0",
              colors.secondary,
              colors.primary,
              colors.accent
            )}>
              {character.name[0]}
            </div>
            <div>
              <span className={clsx("font-bold text-xl block", colors.text)}>
                {character.name}
              </span>
              {character.birthday && (
                <span className="text-stone-500 font-medium">
                  Birthday: {character.birthday[0]} {character.birthday[1]}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-5 text-sm">
            {/* Likes */}
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
                Loves & Likes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {character.likes.map((like, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md border border-rose-100 text-xs font-medium"
                  >
                    {like}
                  </span>
                ))}
              </div>
            </div>

            {/* Dislikes */}
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
                Dislikes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {character.dislikes.map((dislike, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md border border-stone-200 text-xs font-medium"
                  >
                    {dislike}
                  </span>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
                Schedule
              </span>
              <div className="pl-3 border-l-2 border-stone-100 space-y-2 text-stone-600">
                {character.schedule.map((sched, i) => (
                  <p key={i} className="leading-relaxed">{sched}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
