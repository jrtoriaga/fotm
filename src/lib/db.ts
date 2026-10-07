import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Crop, Season } from "../types/app-types";
import { createDBCrop } from "./utils";

interface CropsDb extends DBSchema {
  crops: {
    key: number;
    value: Crop;
    indexes: { by_season: Season };
  };
}

let dbPromise: Promise<IDBPDatabase<CropsDb>>;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CropsDb>("fotm", 1, {
      upgrade(db) {
        const cropsStore = db.createObjectStore("crops", {
          keyPath: "id",
          autoIncrement: true,
        });
        cropsStore.createIndex("by_season", "season");
      },
    });
  }
  return dbPromise;
}

export async function saveCrop(crop: { name: string; plantedDate: number }) {
  try {
    const db = await getDB();

    const dbCrop: Crop = createDBCrop(crop);

    await db.put("crops", dbCrop);
  } catch (err) {
    console.log(err);
  }
}

export async function getAllCropsBySeason(season: Season) {
  try {
    const db = await getDB();
    const tx = db.transaction('crops', 'readonly')
    const index = tx.store.index("by_season")
    const result = await index.getAll(season)
    return result
  } catch (err) {
    console.log(err);
  }
}

export async function deleteCropById(cropId: number){
  try {
    const db = await getDB();

    await db.delete("crops", cropId)
  } catch (err) {
    console.log(err);
  }
}

export async function deleteAllCropsBySeason(season: Season) {
  try {
    const db = await getDB();
    const tx = db.transaction("crops", "readwrite");
    const crops = await tx.store.index("by_season").getAll(season);

    await Promise.all(crops.map((crop) => tx.store.delete(crop.id!)));
    await tx.done;
  } catch (err) {
    console.log(err);
  }
}