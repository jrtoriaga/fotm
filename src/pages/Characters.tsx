import { useCallback, useEffect, useMemo, useState } from "react";
import type { Character } from "../types/app-types";
import { getAllCharacters } from "../lib/repo";
import CharacterModal from "../components/CharacterModal";
import { useTheme } from "../context/ThemeContext";
import clsx from "clsx";

export default function CharactersPage() {
  const { colors } = useTheme();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [isShown, setIsShown] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>();

  useEffect(() => {
    setCharacters(getAllCharacters().sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const filteredCharacters = useMemo(() => {
    const query = nameFilter.trim().toLocaleLowerCase();
    return characters.filter((character) => character.name.toLocaleLowerCase().includes(query));
  }, [characters, nameFilter]);

  const groupedCharacters = useMemo(() => {
    const groups = new Map<string, Character[]>();
    filteredCharacters.forEach((character) => {
      const letter = character.name[0].toLocaleUpperCase();
      groups.set(letter, [...(groups.get(letter) ?? []), character]);
    });
    return groups;
  }, [filteredCharacters]);

  const letters = useMemo(
    () => [...new Set(characters.map((character) => character.name[0].toLocaleUpperCase()))].sort(),
    [characters]
  );

  const handleClick = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setIsShown(true);
  }, []);

  return (
    <div id="characters-top" className="pb-10">
      <div className="page-intro">
        <div>
          <p className="page-kicker">Get to know the residents</p>
          <h1 className="page-title">Characters</h1>
          <p className="page-subtitle">Gift ideas, birthdays, and daily routines for your neighbors.</p>
        </div>
        <span className="hidden rounded-full bg-season-soft px-3 py-1 text-xs font-bold text-season-primary sm:inline-flex">{characters.length} neighbors</span>
      </div>

      <div id="character-controls" className="scroll-mt-6 mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section className="rounded-2xl border border-season bg-gradient-to-br from-[#f5fbf1] to-[#edf6e9] p-4 shadow-sm sm:p-5" aria-labelledby="character-directory-title">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-season-soft text-xl text-season-primary shadow-sm" aria-hidden="true">✦</span>
            <div>
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.16em] text-season-primary">Character directory</p>
              <h2 id="character-directory-title" className="m-0 mt-1 font-serif text-xl font-bold text-[#203f32]">Find a neighbor quickly</h2>
              <p className="mt-1 text-sm text-[#5f6c62]">Use the alphabet or search by name to jump straight to the person you need.</p>
            </div>
          </div>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Jump to character names">
            {letters.map((letter) => <a key={letter} href={`#character-${letter}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b9d2b3] bg-white text-sm font-extrabold text-[#315b45] shadow-sm transition-colors hover:bg-[#f1f7ef]">{letter}</a>)}
          </nav>
        </section>

        <section className="rounded-2xl border border-[#e4d8c3] bg-[#fffdf8] p-4 shadow-sm sm:p-5" aria-labelledby="character-filter-title">
          <div className="flex items-center justify-between gap-3">
            <div><p className="m-0 text-xs font-extrabold uppercase tracking-[0.16em] text-[#9a8a73]">Filters</p><h2 id="character-filter-title" className="m-0 mt-1 text-lg font-bold text-[#315b45]">Refine the directory</h2></div>
            {nameFilter && <button type="button" onClick={() => setNameFilter("")} className="text-xs font-bold text-[#a34d3f] hover:text-[#843b31]">Clear</button>}
          </div>
          <label htmlFor="character-name-filter" className="mt-4 block text-xs font-bold text-stone-600">Search by name</label>
          <div className="relative mt-2"><input id="character-name-filter" type="search" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Try Cliff or Gray" className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 pr-10 text-sm text-stone-700 outline-none transition-shadow placeholder:text-stone-400 focus:border-[#9fbea3] focus:ring-2 focus:ring-[#e5f0e3]" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true">⌕</span></div>
          <p className="mt-2 text-xs text-stone-400" aria-live="polite">Showing {filteredCharacters.length} of {characters.length} neighbors</p>
        </section>
      </div>

      <div className="flex flex-col gap-4">
        {[...groupedCharacters.entries()].map(([letter, value]) => <section key={letter} id={`character-${letter}`} className="scroll-mt-6 rounded-2xl border border-[#dfd2bd] bg-[#fffdf8] p-4 shadow-sm sm:p-5" aria-labelledby={`character-heading-${letter}`}>
          <div className="mb-3 flex items-center justify-between border-b border-[#eadfce] pb-2"><h2 id={`character-heading-${letter}`} className={clsx("m-0 font-serif text-2xl font-bold", colors.primary)}>{letter}</h2><span className="rounded-full bg-season-soft px-2.5 py-1 text-xs font-bold text-season-primary">{value.length}</span></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{value.map((character) => <button type="button" className="group flex items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-[#d7e5d4] hover:bg-[#f1f7ef]" key={character.name} onClick={() => handleClick(character)}><span className={clsx("flex size-10 shrink-0 items-center justify-center rounded-full border text-lg font-bold shadow-sm", colors.secondary, colors.primary, colors.accent)}>{character.name[0]}</span><span className="font-bold text-stone-700 group-hover:text-[#315b45]">{character.name}</span><span className="ml-auto text-stone-300 transition-colors group-hover:text-[#4f8061]" aria-hidden="true">→</span></button>)}</div>
        </section>)}
        {!filteredCharacters.length && <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#fffdf8] px-5 py-12 text-center shadow-sm"><p className="m-0 text-lg font-bold text-[#315b45]">No neighbors found</p><p className="mt-1 text-sm text-stone-500">Try a different name or clear the filter.</p></div>}
      </div>

      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        <a
          href="#character-controls"
          className="inline-flex items-center gap-2 rounded-full border border-[#b9d2b3] bg-[#fffaf0] px-3 py-2 text-xs font-extrabold text-[#315b45] shadow-lg shadow-[#4f8061]/15 transition-all hover:-translate-y-0.5 hover:bg-[#f1f7ef] focus:outline-none focus:ring-2 focus:ring-[#9fbea3] focus:ring-offset-2"
          aria-label="Return to character filters and alphabet shortcuts"
          title="Return to filters and alphabet shortcuts"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-season-soft text-season-primary" aria-hidden="true">⌕</span>
          <span className="hidden sm:inline">Filters &amp; alphabet</span>
          <span className="sm:hidden">Shortcuts</span>
        </a>
        <a
          href="#characters-top"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dfd2bd] bg-[#fffdf8] text-sm font-bold text-[#9a8a73] shadow-md transition-colors hover:bg-[#f5efe2] hover:text-[#5f513e] focus:outline-none focus:ring-2 focus:ring-[#d8cbb5] focus:ring-offset-2"
          aria-label="Return to top of characters page"
          title="Back to top"
        >
          ↑
        </a>
      </div>

      <CharacterModal isOpen={isShown} onClose={() => setIsShown(false)} characters={selectedCharacter ? [selectedCharacter] : []} />
    </div>
  );
}