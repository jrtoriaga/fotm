import { useCallback, useEffect, useState } from "react";
import type { Character } from "../types/app-types";
import { getAllCharacters } from "../lib/repo";
import CharacterModal from "../components/CharacterModal";
import { useTheme } from "../context/ThemeContext";
import clsx from "clsx";

export default function CharactersPage() {
  const { colors } = useTheme();
  const [characters, setCharacters] = useState<Map<string, Character[]>>(
    new Map()
  );

  // Modal attribute
  const [isShown, setIsShown] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>();

  // Set it up
  useEffect(() => {
    const rawCharacters = getAllCharacters();

    const newCharacters = new Map<string, Character[]>();

    rawCharacters.forEach((character) => {
      if (!newCharacters.has(character.name[0])) {
        newCharacters.set(character.name[0], []);
      }
      newCharacters.get(character.name[0])!.push(character);
    });

    const sorted = new Map(
      [...newCharacters.entries()].sort(([a], [b]) => a.localeCompare(b))
    );

    setCharacters(sorted);
  }, []);

  const handleClick = useCallback((key: string, i: number) => {
    const s = characters.get(key)?.[i];
    if (s) setSelectedCharacter(s);
    setIsShown(true)
  }, [characters]);

  return (
    <div className="p-4 h-[calc(100vh-64px)] overflow-scroll">
      <h3 className={clsx("mb-4 text-xl font-bold", colors.primary)}>Characters</h3>

      {/* Items */}
      <div className="flex flex-col gap-6 pb-10">
        {characters &&
          [...characters.entries()].map(([key, value], i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border border-stone-200 p-4">
              {/* Letter */}
              <span className={clsx("mb-3 block font-bold text-lg border-b border-stone-100 pb-1", colors.text)}>{key}</span>

              {/* Characters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {value.map((character, i) => (
                  <div 
                    className="flex gap-3 items-center p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors border border-transparent hover:border-stone-100" 
                    key={`char-${i}`} 
                    onClick={() => handleClick(key, i)}
                  >
                    {/* Icon Placeholder */}
                    <div className={clsx("size-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm", colors.secondary, colors.primary)}>
                      {character.name[0]}
                    </div>

                    {/* Name */}
                    <span className="font-medium text-stone-700">{character.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      <CharacterModal
        isOpen={isShown}
        onClose={() => setIsShown(false)}
        characters={selectedCharacter ? [selectedCharacter] : []}
      />
    </div>
  );
}
