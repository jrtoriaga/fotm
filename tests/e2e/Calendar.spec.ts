import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import { chromium, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

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

function dayCell(day: number) {
  return page.locator("main .flex.flex-wrap.bg-white").locator(":scope > div").nth(day - 1);
}

async function plantCrop(cropName: string, plantedDay: number) {
  await page.getByRole("button", { name: "Plant Crop" }).first().click();
  await page.locator("#crops").selectOption({ label: cropName });
  await page.locator("#plantedDay").selectOption(String(plantedDay));
  await page.getByRole("button", { name: "Plant Crop" }).last().click();
}

describe("Calendar page", () => {
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
    await page.goto(baseURL);
    await expect(page.getByRole("heading", { name: "Crop Calendar" })).toBeVisible();
  });

  afterEach(async () => {
    await context?.close();
  });

  it("switches seasons and offers crops for the selected season", async () => {
    await plantCrop("Turnip", 4);
    await expect(dayCell(4).getByRole("button", { name: "Turnip" })).toBeVisible();

    await page.locator("#season").selectOption("Summer");
    await expect(dayCell(4).getByRole("button", { name: "Turnip" })).toHaveCount(0);
    await page.getByRole("button", { name: "Plant Crop" }).first().click();

    await expect(page.getByRole("heading", { name: "Planting in Summer" })).toBeVisible();
    await expect(page.locator("#crops")).toContainText("Tomato");
    await expect(page.locator("#crops")).not.toContainText("Turnip");
  });

  it("plants a crop on the selected day and shows the crop on its planted and harvest dates", async () => {
    await dayCell(6).click();
    await plantCrop("Turnip", 6);

    await expect(dayCell(6).getByRole("button", { name: "Turnip" })).toBeVisible();
    await expect(dayCell(10).getByRole("button", { name: "Turnip" })).toBeVisible();
    await expect(dayCell(5).getByRole("button", { name: "Turnip" })).toHaveCount(0);
    await expect(page.locator("#crops")).toBeHidden();
  });

  it("places each regrowing crop harvest on the correct calendar dates", async () => {
    // Cucumber takes 9 days for its first harvest and regrows every 5 days.
    await plantCrop("Cucumber", 3);

    for (const day of [3, 12, 17, 22, 27]) {
      await expect(dayCell(day).getByRole("button", { name: "Cucumber" })).toBeVisible();
    }

    for (const day of [11, 13, 16, 18, 21, 23, 26, 28]) {
      await expect(dayCell(day).getByRole("button", { name: "Cucumber" })).toHaveCount(0);
    }
  });

  it("deletes a selected crop from the calendar", async () => {
    await plantCrop("Turnip", 2);
    const plantedTurnip = dayCell(2).getByRole("button", { name: "Turnip" });
    await plantedTurnip.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "Delete Turnip" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("Delete Turnip?");
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete crop" }).click();

    await expect(plantedTurnip).toHaveCount(0);
    await expect(dayCell(6).getByRole("button", { name: "Turnip" })).toHaveCount(0);
  });

  it("opens the planted crops for a date by double tapping the date or tapping a crop", async () => {
    await plantCrop("Turnip", 4);

    await dayCell(4).locator("span").first().dblclick();
    await expect(page.getByRole("dialog")).toContainText("Crops on day 4");
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Crops planted" })).toBeVisible();
    await page.getByRole("button", { name: "Close crop inspection" }).last().click();

    await dayCell(4).getByRole("button", { name: "Turnip" }).click();
    await expect(page.getByRole("dialog")).toContainText("Crops on day 4");
  });

  it("plants a crop from field notes using the opened date", async () => {
    await dayCell(9).locator("span").first().dblclick();

    const modal = page.getByRole("dialog");
    await modal.getByRole("button", { name: "Plant a crop" }).click();
    await expect(modal.getByRole("heading", { name: "Plant a crop on day 9" })).toBeVisible();

    await modal.locator("#field-notes-crop").selectOption({ label: "Turnip" });
    await modal.getByRole("button", { name: "Plant Crop" }).click();

    await expect(modal.getByRole("heading", { name: "Plant a crop on day 9" })).toBeVisible();
    await expect(dayCell(9).getByRole("button", { name: "Turnip" })).toBeVisible();
    await expect(dayCell(13).getByRole("button", { name: "Turnip" })).toBeVisible();
    await expect(dayCell(8).getByRole("button", { name: "Turnip" })).toHaveCount(0);
  });

  it("refreshes the first field-notes card after planting inline", async () => {
    await dayCell(7).locator("span").first().dblclick();

    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: "Crops planted" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Turnip" })).toHaveCount(0);

    await modal.getByRole("button", { name: "Plant a crop" }).click();
    await modal.locator("#field-notes-crop").selectOption({ label: "Turnip" });
    await modal.getByRole("button", { name: "Plant Crop" }).click();

    const plantedCropsCard = modal.getByRole("heading", { name: "Crops planted" }).locator("xpath=ancestor::section");
    await expect(plantedCropsCard.getByRole("button", { name: "Turnip" })).toBeVisible();
    await expect(modal.getByText("1", { exact: true })).toBeVisible();
  });

  it("can hide the inline planting card without closing field notes", async () => {
    await dayCell(5).locator("span").first().dblclick();
    const modal = page.getByRole("dialog");

    await modal.getByRole("button", { name: "Plant a crop" }).click();
    await expect(modal.getByRole("heading", { name: "Plant a crop on day 5" })).toBeVisible();
    await modal.getByRole("button", { name: "Hide planting card" }).click();

    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "Plant a crop on day 5" })).toHaveCount(0);
  });

  it("asks for confirmation before deleting a crop", async () => {
    await plantCrop("Turnip", 2);
    await dayCell(2).getByRole("button", { name: "Turnip" }).click();

    const modal = page.getByRole("dialog");
    await modal.getByRole("button", { name: "Delete Turnip" }).click();
    const warning = page.getByRole("alertdialog");
    await expect(warning).toContainText("Delete Turnip?");
    await warning.getByRole("button", { name: "Cancel" }).click();
    await expect(modal).toBeVisible();
    await expect(dayCell(2).getByRole("button", { name: "Turnip" })).toBeVisible();
  });

  it("asks for confirmation before resetting a season calendar", async () => {
    await plantCrop("Turnip", 2);
    await page.getByRole("button", { name: "Reset Calendar" }).click();

    const warning = page.getByRole("alertdialog");
    await expect(warning).toContainText("Reset Spring calendar?");
    await expect(warning).toContainText("Other season calendars will not be changed.");
    await warning.getByRole("button", { name: "Cancel" }).click();
    await expect(warning).toHaveCount(0);
    await expect(dayCell(2).getByRole("button", { name: "Turnip" })).toBeVisible();
  });

  it("cleans up only the selected season calendar", async () => {
    await plantCrop("Turnip", 2);
    await page.locator("#season").selectOption("Summer");
    await plantCrop("Tomato", 3);

    await page.getByRole("button", { name: "Reset Calendar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset calendar" }).click();
    await expect(dayCell(3).getByRole("button", { name: "Tomato" })).toHaveCount(0);

    await page.locator("#season").selectOption("Spring");
    await expect(dayCell(2).getByRole("button", { name: "Turnip" })).toBeVisible();
  });

  it("cleans up all crops from the selected season calendar", async () => {
    await plantCrop("Turnip", 2);
    await plantCrop("Parsnip", 8);

    await page.getByRole("button", { name: "Reset Calendar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset calendar" }).click();

    await expect(dayCell(2).getByRole("button", { name: "Turnip" })).toHaveCount(0);
    await expect(dayCell(6).getByRole("button", { name: "Turnip" })).toHaveCount(0);
    await expect(dayCell(8).getByRole("button", { name: "Parsnip" })).toHaveCount(0);
    await expect(dayCell(12).getByRole("button", { name: "Parsnip" })).toHaveCount(0);
  });

  it("shows crop information after tapping the crop name without leaving the calendar", async () => {
    await plantCrop("Turnip", 2);
    await dayCell(2).getByRole("button", { name: "Turnip" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: "Turnip" })).toBeVisible();
    await expect(modal).toContainText("First harvest");
    await expect(modal).toContainText("4 days");
    await expect(page.getByRole("heading", { name: "Crop Calendar" })).toBeVisible();
  });

  it("keeps the selected-date marker until another date is selected", async () => {
    await dayCell(8).click();
    await expect(dayCell(8).locator("span")).toHaveClass(/bg-red-500/);

    await page.reload();
    await expect(dayCell(8).locator("span")).toHaveClass(/bg-red-500/);

    await page.locator("#season").selectOption("Summer");
    await expect(dayCell(8).locator("span")).toHaveClass(/bg-red-500/);
    await expect(dayCell(7).locator("span")).not.toHaveClass(/bg-red-500/);

    await dayCell(11).click();
    await expect(dayCell(11).locator("span")).toHaveClass(/bg-red-500/);
    await expect(dayCell(8).locator("span")).not.toHaveClass(/bg-red-500/);
  });
});
