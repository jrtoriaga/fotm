import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import {
  chromium,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import crops from "../../src/data/crops";
import type { Season } from "../../src/types/app-types";

const baseURL = "http://127.0.0.1:4173";
const seasons: Season[] = ["Spring", "Summer", "Fall"];

let viteServer: ChildProcess;
let browser: Browser;
let context: BrowserContext;
let page: Page;

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (viteServer.exitCode !== null) {
      throw new Error(`Vite exited unexpectedly with code ${viteServer.exitCode}`);
    }

    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await delay(200);
  }

  throw new Error(`Vite did not start at ${baseURL}`);
}

function seasonSection(season: Season) {
  return page.locator(`[data-season="${season}"]`);
}

describe("Crops page", () => {
  beforeAll(async () => {
    viteServer = spawn(
      process.execPath,
      ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
      { stdio: "ignore" },
    );
    await waitForServer();
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser?.close();
    viteServer?.kill("SIGTERM");
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto(`${baseURL}/crops`);
    await expect(page.getByRole("heading", { name: "Crop Almanac" })).toBeVisible();
  });

  afterEach(async () => {
    await context?.close();
  });

  it("shows every available crop exactly once", async () => {
    const cropNames = crops.map(({ name }) => name);

    for (const name of cropNames) {
      await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
    }

    await expect(page.locator("tbody tr")).toHaveCount(crops.length);
    for (const name of cropNames) {
      await expect(page.getByRole("cell", { name, exact: true })).toHaveCount(1);
    }
  });

  it("groups crops under their correct season headings in season order", async () => {
    const renderedSeasons = await page
      .locator("[data-season]")
      .evaluateAll((sections) => sections.map((section) => section.getAttribute("data-season")));

    expect(renderedSeasons).toEqual(seasons.filter((season) => crops.some((crop) => crop.season === season)));

    for (const season of seasons) {
      const section = seasonSection(season);
      const seasonCrops = crops.filter((crop) => crop.season === season);

      if (seasonCrops.length === 0) {
        await expect(section).toHaveCount(0);
        continue;
      }

      await expect(section.getByRole("heading", { name: season })).toHaveCount(1);
      await expect(section.getByText(season, { exact: true })).toBeVisible();

      for (const crop of seasonCrops) {
        await expect(section.getByRole("cell", { name: crop.name, exact: true })).toBeVisible();
      }

      for (const crop of crops.filter((item) => item.season !== season)) {
        await expect(section.getByRole("cell", { name: crop.name, exact: true })).toHaveCount(0);
      }
    }
  });

  it("shows the expected columns and every crop's harvest, regrowth, seed, and sell values", async () => {
    const expectedHeaders = ["Name", "Harvest", "Regrow", "Seed", "Sell"];

    for (const table of await page.getByRole("table").all()) {
      await expect(table.getByRole("columnheader")).toHaveText(expectedHeaders);
    }

    for (const crop of crops) {
      const section = seasonSection(crop.season);
      const row = section.getByRole("row").filter({
        has: page.getByRole("cell", { name: crop.name, exact: true }),
      });

      await expect(row).toHaveCount(1);
      await expect(row.getByRole("cell")).toHaveText([
        crop.name,
        `${crop.harvest_time}d`,
        crop.regrowth_time === null ? "-" : `${crop.regrowth_time}d`,
        `${crop.seed_cost}g`,
        `${crop.sell_price}g`,
      ]);
    }
  });

  it("displays a dash for crops that do not regrow and day values for crops that do", async () => {
    const nonRegrowingCrop = crops.find((crop) => crop.regrowth_time === null);
    const regrowingCrop = crops.find((crop) => crop.regrowth_time !== null);

    expect(nonRegrowingCrop).toBeDefined();
    expect(regrowingCrop).toBeDefined();

    const nonRegrowingRow = seasonSection(nonRegrowingCrop!.season)
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: nonRegrowingCrop!.name, exact: true }) });
    const regrowingRow = seasonSection(regrowingCrop!.season)
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: regrowingCrop!.name, exact: true }) });

    await expect(nonRegrowingRow.getByRole("cell").nth(2)).toHaveText("-");
    await expect(regrowingRow.getByRole("cell").nth(2)).toHaveText(`${regrowingCrop!.regrowth_time}d`);
  });
});
