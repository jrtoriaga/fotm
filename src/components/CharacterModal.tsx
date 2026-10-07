import clsx from "clsx";
import { useTheme } from "../context/ThemeContext";
import type { Character } from "../types/app-types";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  title?: string;
}

export default function CharacterModal({
  isOpen,
  onClose,
  characters,
  title = "Character Details",
}: CharacterModalProps) {
  const { colors } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="character-modal-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close character details"
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#ddcfb4] bg-[#fffaf0] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4d8c3] bg-[#f7f0e3] p-4">
          <div><p className="page-kicker">Valley notes</p><h2 id="character-modal-title" className="m-0 font-serif text-2xl font-bold text-[#203f32]">{title}</h2></div>
          <button
            onClick={onClose}
            aria-label="Close character details"
            className="rounded-full p-2 text-xl text-[#9a8a73] transition-colors hover:bg-[#eadfcd] hover:text-[#5f513e]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 overflow-y-auto bg-[#fffaf0] p-4">
          {characters && characters.length > 0 ? (
            characters.map((character, i) => (
              <div
                key={i}
                    className="rounded-xl border border-[#e4d8c3] bg-[#fffdf8] p-4 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* Avatar */}
                  <div
                    className={clsx(
                      "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border shadow-sm shrink-0",
                      colors.secondary,
                      colors.primary,
                      colors.accent
                    )}
                  >
                    {character.name[0]}
                  </div>
                  <div>
                    <span
                      className={clsx("font-bold text-xl block", colors.text)}
                    >
                      {character.name}
                    </span>
                    {character.birthday && (
                      <span className="text-stone-500 font-medium text-sm">
                        Birthday: {character.birthday[0]}{" "}
                        {character.birthday[1]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  {/* Likes */}
                  <div>
                    <span
                      className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a8a73]"
                    >
                      Loves & Likes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {character.likes.map((like, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-[#d9aab1] bg-[#f3dede] px-2.5 py-1 text-xs font-medium text-[#843b45]"
                        >
                          {like}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dislikes */}
                  <div>
                    <span
                      className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a8a73]"
                    >
                      Dislikes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {character.dislikes.map((dislike, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-[#eee5d5] bg-[#f5efe2] px-2.5 py-1 text-xs font-medium text-stone-600"
                        >
                          {dislike}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  {characters.length > 1 ? (
                    <details className="group">
                      <summary className="cursor-pointer list-none flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors font-semibold select-none">
                        <span className="transition-transform duration-200 group-open:rotate-90 text-xs">
                          ▶
                        </span>
                        <span>View Schedule</span>
                      </summary>
                      <div className="mt-2 pl-3 border-l-2 border-stone-100 space-y-1.5 text-stone-600">
                        {character.schedule.map((sched, i) => (
                          <p key={i} className="leading-relaxed">
                            {sched}
                          </p>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
                        Schedule
                      </span>
                      <div className="pl-3 border-l-2 border-stone-100 space-y-2 text-stone-600">
                        {character.schedule.map((sched, i) => (
                          <p key={i} className="leading-relaxed">
                            {sched}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-stone-400">
              No characters found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
