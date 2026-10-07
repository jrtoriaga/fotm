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
  return page
    .locator("main .flex.flex-wrap.bg-white")
    .locator(":scope > div")
    .nth(day - 1);
}

function characterModal() {
  return page.locator(".fixed.inset-0.z-50");
}

describe("Birthday calendar page", () => {
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
    await page.goto(`${baseURL}/birthdays`);
    await expect(page.getByRole("heading", { name: "Birthdays" }).first()).toBeVisible();
    await expect(dayCell(30)).toBeVisible();
  });

  afterEach(async () => {
    await context?.close();
  });

  it("switches between seasons and shows birthdays for the selected season", async () => {
    const seasonSelect = page.locator("#season");

    await expect(seasonSelect).toHaveValue("Spring");
    await expect(dayCell(17).locator('[title="Barley"]')).toBeVisible();
    await expect(dayCell(17).locator('[title="Ann"]')).toHaveCount(0);

    await seasonSelect.selectOption("Summer");
    await expect(seasonSelect).toHaveValue("Summer");
    await expect(dayCell(17).locator('[title="Ann"]')).toBeVisible();
    await expect(dayCell(17).locator('[title="Barley"]')).toHaveCount(0);

    await seasonSelect.selectOption("Fall");
    await expect(seasonSelect).toHaveValue("Fall");
    await expect(dayCell(23).locator('[title="Anna"]')).toBeVisible();
    await expect(dayCell(17).locator('[title="Ann"]')).toHaveCount(0);

    await seasonSelect.selectOption("Winter");
    await expect(seasonSelect).toHaveValue("Winter");
    await expect(dayCell(17).locator('[title="Anna"]')).toHaveCount(0);
  });

  it("marks the selected day and restores it after reload and season changes", async () => {
    await dayCell(8).locator("span").click();
    await expect(dayCell(8).locator("span")).toHaveClass(/bg-red-500/);
    await expect(dayCell(7).locator("span")).not.toHaveClass(/bg-red-500/);

    await page.reload();
    await expect(dayCell(8).locator("span")).toHaveClass(/bg-red-500/);

    await page.locator("#season").selectOption("Summer");
    await expect(dayCell(8).locator("span")).toHaveClass(/bg-red-500/);

    await dayCell(11).locator("span").click();
    await expect(dayCell(11).locator("span")).toHaveClass(/bg-red-500/);
    await expect(dayCell(8).locator("span")).not.toHaveClass(/bg-red-500/);
  });

  it("shows the correct character birthdays on their calendar date", async () => {
    await expect(dayCell(17).locator('[title="Barley"]')).toBeVisible();
    await expect(dayCell(16).locator('[title="Barley"]')).toHaveCount(0);
    await expect(dayCell(18).locator('[title="Barley"]')).toHaveCount(0);

    await dayCell(17).click();
    await expect(characterModal()).toContainText("Barley");
    await expect(characterModal()).toContainText("Birthday: Spring 17");
  });

  it("opens the character modal when a birthday day is clicked", async () => {
    await dayCell(17).click();

    await expect(characterModal()).toBeVisible();
    await expect(characterModal()).toContainText("Barley");
  });

  it("closes the character modal with its close button", async () => {
    await dayCell(17).click();
    await expect(characterModal()).toBeVisible();

    await characterModal().locator("button").click();
    await expect(characterModal()).toHaveCount(0);
  });

  it("closes the character modal when its backdrop is clicked", async () => {
    await dayCell(17).click();
    await expect(characterModal()).toBeVisible();

    await characterModal().locator(":scope > div").first().click({ position: { x: 5, y: 5 } });
    await expect(characterModal()).toHaveCount(0);
  });

  it("does not open a modal when a day has no birthdays", async () => {
    await expect(dayCell(1).locator("[title]")).toHaveCount(0);

    await dayCell(1).click();
    await expect(characterModal()).toHaveCount(0);
  });
});
