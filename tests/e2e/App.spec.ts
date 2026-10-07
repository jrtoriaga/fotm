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

const baseURL = "http://127.0.0.1:4173";

const routes = [
  { path: "/", heading: "Crop Calendar" },
  { path: "/birthdays", heading: "Birthdays" },
  { path: "/crops", heading: "Crop Almanac" },
  { path: "/profitability", heading: "Crop Profitability" },
  { path: "/characters", heading: "Characters" },
] as const;

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

function calendarDay(day: number) {
  return page
    .locator("main .flex.flex-wrap.bg-white")
    .locator(":scope > div")
    .nth(day - 1);
}

async function expectCalendarState(season: string, day: number) {
  await expect(page.locator("#season")).toHaveValue(season);
  await expect(calendarDay(day).locator("span")).toHaveClass(/bg-red-500/);
}

describe("App navigation and shared calendar state", () => {
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

  it("navigates to every page from the shared navigation", async () => {
    for (const route of routes.slice(1)) {
      await page.locator(`nav a[href="${route.path}"]`).click();

      await expect(page).toHaveURL(`${baseURL}${route.path}`);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    }

    await page.locator('nav a[href="/"]').click();
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByRole("heading", { name: "Crop Calendar" })).toBeVisible();
  });

  it("supports browser back and forward navigation between app pages", async () => {
    await page.locator('nav a[href="/birthdays"]').click();
    await expect(page.getByRole("heading", { name: "Birthdays" })).toBeVisible();

    await page.locator('nav a[href="/characters"]').click();
    await expect(page.getByRole("heading", { name: "Characters" })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(`${baseURL}/birthdays`);
    await expect(page.getByRole("heading", { name: "Birthdays" })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(`${baseURL}/characters`);
    await expect(page.getByRole("heading", { name: "Characters" })).toBeVisible();
  });

  it("keeps the chosen season and calendar date when switching between pages", async () => {
    const season = "Summer";
    const selectedDay = 12;

    await page.locator("#season").selectOption(season);
    await calendarDay(selectedDay).click();
    await expectCalendarState(season, selectedDay);

    // The birthday calendar should use the same season and selected-day state.
    await page.locator('nav a[href="/birthdays"]').click();
    await expect(page.getByRole("heading", { name: "Birthdays" })).toBeVisible();
    await expectCalendarState(season, selectedDay);

    // Changes made on the birthday calendar should also be visible on the crop calendar.
    const birthdaySeason = "Fall";
    const birthdayDay = 18;
    await page.locator("#season").selectOption(birthdaySeason);
    await calendarDay(birthdayDay).locator("span").click();

    // Switching through non-calendar pages must not reset shared state either.
    for (const route of [routes[2], routes[3], routes[4]]) {
      await page.locator(`nav a[href="${route.path}"]`).click();
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    }

    await page.locator('nav a[href="/"]').click();
    await expectCalendarState(birthdaySeason, birthdayDay);

    await page.locator('nav a[href="/birthdays"]').click();
    await expectCalendarState(birthdaySeason, birthdayDay);
  });
});
