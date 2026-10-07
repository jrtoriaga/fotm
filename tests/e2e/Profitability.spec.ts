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

function calculatorCard() {
  return page.getByRole("heading", { name: /Plan your / }).locator("xpath=ancestor::section");
}

function overviewCard() {
  return page.getByRole("heading", { name: /Best crops from day/ }).locator("xpath=ancestor::section");
}

function overviewCrop(cropName: string) {
  return overviewCard().getByRole("button").filter({ hasText: cropName });
}

async function selectCrop(cropName: string) {
  await page.locator("#crop-select").selectOption({ label: cropName });
}

async function setPlantingDay(day: number) {
  await page.locator("#planting-day").fill(String(day));
  await page.locator("#planting-day").press("Tab");
}

describe("Profitability page", () => {
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
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto(`${baseURL}/profitability`);
    await expect(page.getByRole("heading", { name: "Crop Profitability" })).toBeVisible();
  });

  afterEach(async () => {
    await context?.close();
  });

  it("renders the calculator, seasonal overview, and full comparison", async () => {
    await expect(page.getByRole("heading", { name: /Best crops from day/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Plan your / })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Compare Spring crops from day/ })).toBeVisible();
    await expect(page.locator("#season")).toHaveValue("Spring");
    await expect(page.locator("#planting-day")).toHaveValue("1");
    await expect(page.locator("#plots")).toHaveValue("9");
  });

  it("uses the calendar current day as the initial planting day", async () => {
    await page.evaluate(() => window.localStorage.setItem("currentDay", "8"));
    await page.reload();

    await expect(page.locator("#planting-day")).toHaveValue("8");
    await expect(page.getByRole("heading", { name: "Best crops from day 8" })).toBeVisible();
    await expect(page.getByText(/harvests remain if planted on day 8/)).toBeVisible();
  });

  it("calculates regrowing crops from the selected planting day", async () => {
    await selectCrop("Cucumber");
    await setPlantingDay(8);

    const card = calculatorCard();
    await expect(card.getByText("↻ Regrowing crop")).toBeVisible();
    await expect(card).toContainText("3 harvests remain if planted on day 8.");
    await expect(card.getByText("Day 17")).toBeVisible();
    await expect(card.getByText("+1,420g")).toBeVisible();

    await setPlantingDay(21);

    await expect(card).toContainText("1 harvest remains if planted on day 21.");
    await expect(card.getByText("Day 30")).toBeVisible();
    await expect(card.getByText("+340g")).toBeVisible();
  });

  it("calculates single-harvest crops with replanting costs", async () => {
    await selectCrop("Potato");
    await setPlantingDay(8);

    const card = calculatorCard();
    await expect(card.getByText("✦ Single-harvest crop")).toBeVisible();
    await expect(card).toContainText("3 harvests remain if planted on day 8.");
    await expect(card).toContainText("replant and buy new seeds after each harvest");
    await expect(card.getByText("+1,710g")).toBeVisible();

    await setPlantingDay(21);

    await expect(card).toContainText("1 harvest remains if planted on day 21.");
    await expect(card.getByText("+570g")).toBeVisible();
  });

  it("updates the seasonal overview profit when the planting day changes", async () => {
    await selectCrop("Cucumber");
    await setPlantingDay(8);
    await expect(overviewCrop("Cucumber")).toContainText("1,420g");

    await setPlantingDay(21);
    await expect(overviewCrop("Cucumber")).toContainText("340g");
    await expect(overviewCrop("Cucumber")).not.toContainText("1,420g");
  });

  it("keeps overview profits aligned with the calculator for the selected plot count", async () => {
    await selectCrop("Cucumber");
    await page.locator("#plots").fill("18");
    await page.locator("#plots").press("Tab");
    await setPlantingDay(8);

    const card = calculatorCard();
    await expect(card.getByText("+2,840g")).toBeVisible();
    await expect(overviewCrop("Cucumber")).toContainText("2,840g");
  });

  it("changes available crops and comparison rows when the season changes", async () => {
    await page.locator("#season").selectOption("Summer");

    await expect(page.getByRole("heading", { name: /Best crops from day/ })).toBeVisible();
    await expect(page.locator("#crop-select")).toContainText("Tomato");
    await expect(page.locator("#crop-select")).not.toContainText("Cucumber");
    await expect(page.getByRole("heading", { name: /Compare Summer crops from day/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Plan your Tomato field/ })).toBeVisible();
  });

  it("shows a no-harvest state for crops planted too late in the season", async () => {
    await selectCrop("Cucumber");
    await setPlantingDay(30);

    const card = calculatorCard();
    await expect(card).toContainText("No harvests remain if planted on day 30.");
    await expect(card.getByText("None")).toBeVisible();
    await expect(card.getByText("+0g")).toBeVisible();
  });
});
