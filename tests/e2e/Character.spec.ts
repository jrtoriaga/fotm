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
import characters from "../../src/data/characters";

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

function characterModal() {
  return page.locator(".fixed.inset-0.z-50");
}

describe("Characters page", () => {
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
    await page.goto(`${baseURL}/characters`);
    await expect(page.getByRole("heading", { name: "Characters" })).toBeVisible();
  });

  afterEach(async () => {
    await context?.close();
  });

  it("shows every character in the character list", async () => {
    for (const character of characters) {
      await expect(page.getByText(character.name, { exact: true })).toBeVisible();
    }

    await expect(page.locator(".cursor-pointer")).toHaveCount(characters.length);
  });

  it("opens details for the selected character only", async () => {
    await page.getByText("Ann", { exact: true }).click();

    const modal = characterModal();
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Ann", { exact: true })).toBeVisible();
    await expect(modal.getByText("Anna", { exact: true })).toHaveCount(0);

    await modal.getByRole("button").click();
    await expect(modal).toHaveCount(0);

    await page.getByText("Anna", { exact: true }).click();
    await expect(characterModal().getByText("Anna", { exact: true })).toBeVisible();
    await expect(characterModal().getByText("Ann", { exact: true })).toHaveCount(0);
  });

  it("shows the selected character's likes, dislikes, and schedule", async () => {
    await page.getByText("Ann", { exact: true }).click();

    const modal = characterModal();
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Loves & Likes")).toBeVisible();
    await expect(modal.getByText("Cake", { exact: true })).toBeVisible();
    await expect(modal.getByText("Dislikes", { exact: true })).toBeVisible();
    await expect(modal.getByText("Medicine", { exact: true })).toBeVisible();
    await expect(modal.getByText("Schedule", { exact: true })).toBeVisible();
    await expect(modal).toContainText("Sunny days:");
    await expect(modal).toContainText("Rain/Snow:");
  });

  it("closes the character modal with its close button", async () => {
    await page.getByText("Ann", { exact: true }).click();
    const modal = characterModal();
    await expect(modal).toBeVisible();

    await modal.locator("button").click();
    await expect(modal).toHaveCount(0);
  });

  it("closes the character modal when its backdrop is clicked", async () => {
    await page.getByText("Ann", { exact: true }).click();
    const modal = characterModal();
    await expect(modal).toBeVisible();

    await modal.locator(":scope > div").first().click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveCount(0);
  });
});
