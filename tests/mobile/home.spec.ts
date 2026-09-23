import { expect, test, type Page } from "@playwright/test";

test("mobile widths have readable content, no horizontal overflow and no 3D", async ({
  page,
}) => {
  test.setTimeout(120_000); // Six fresh navigations, including the first Next.js compilation.
  const resources: string[] = [];
  const failures: string[] = [];
  page.on("request", (request) => {
    if (/\.(?:glb|gltf|hdr)(?:\?|$)|\/textures\//.test(request.url()))
      resources.push(request.url());
  });
  page.on("pageerror", (error) => failures.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes("webgl"))
        throw new Error("WebGL must not start on mobile");
      return original.apply(this, args);
    } as typeof original;
  });
  for (const width of [320, 375, 390, 430, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("[data-mobile-home]")).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("#nos-agents-ia button")).toHaveCount(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}px`,
    ).toBe(true);
    for (const id of [
      "nos-services",
      "nos-agents-ia",
      "comment-choisir",
      "contact",
    ])
      await expect(page.locator(`#${id}`)).toBeAttached();
  }
  expect(resources).toEqual([]);
  expect(failures).toEqual([]);
});

test("native scroll reveals every chapter and updates the reading progress", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  for (const id of [
    "mission",
    "nos-services",
    "nos-agents-ia",
    "comment-choisir",
    "questions",
    "contact",
  ]) {
    const introduction = page.locator(`#${id} [data-reveal]`).first();
    await introduction.scrollIntoViewIfNeeded();
    await expect(introduction).toHaveAttribute(
      "data-revealed",
      "true",
    );
  }
  expect(
    await page
      .locator("[data-mobile-header] > div > span")
      .evaluate((element) => getComputedStyle(element).transform),
  ).not.toBe("matrix(0, 0, 0, 1, 0, 0)");
});

test("menu, deep links and reduced motion work without the desktop loader", async ({
  page,
}) => {
  await page.goto("/#nos-agents-ia");
  await expect(page.locator("#nos-agents-ia")).toBeInViewport();
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ouvrir le menu" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await menu.getByRole("link", { name: "Nos services" }).click();
  await expect(page.locator("#nos-services")).toBeInViewport();
  await expect(menu).not.toBeVisible();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    ),
  ).not.toBe("hidden");
});

test("each agent opens the right 2D profile and passes their need to contact", async ({
  page,
}) => {
  await page.goto("/");
  for (const [name, need] of [
    ["Déa", "content"],
    ["Loic", "support"],
    ["May", "prospection"],
    ["Diva", "automation"],
    ["Morgan", "data"],
  ]) {
    await page
      .getByRole("button", { name: new RegExp(`^Découvrir ${name},`) })
      .click();
    const dialog = page.getByRole("dialog", { name });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("img")).toHaveAttribute(
      "src",
      `/images/agents/${need}.webp`,
    );
    await dialog.getByRole("button", { name: `Recruter ${name}` }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator("#mobile-contact-need")).toHaveValue(need);
    await expect(page.locator("#contact")).toBeInViewport();
  }
});

test("agent demos remain available without WebGL", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  for (const name of ["Déa", "Loic", "May", "Diva", "Morgan"]) {
    await page.getByRole("button", { name: new RegExp(`^Découvrir ${name},`) }).click();
    const dialog = page.getByRole("dialog", { name });
    await dialog.getByRole("button", { name: "Voir la démonstration" }).click();
    await expect(
      dialog.getByRole("button", { name: "Rejouer la démonstration" }),
    ).toBeVisible();
    await expect(dialog.locator("[data-agent] > *")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(
      await dialog.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return element.scrollWidth <= element.clientWidth &&
          [...element.querySelectorAll("[data-agent] ol > li, [data-agent] ol > li > *")]
            .every((item) => {
              const rect = item.getBoundingClientRect();
              return rect.left >= bounds.left && rect.right <= bounds.right;
            });
      }),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Fermer la fiche" }).click();
  }
});

async function answer(page: Page, label: string, last = false) {
  const section = page.locator("#comment-choisir");
  await section.getByLabel(label, { exact: false }).check();
  await section
    .getByRole("button", {
      name: last ? "Voir mon résultat" : "Continuer",
      exact: true,
    })
    .click();
}

for (const scenario of [
  {
    name: "ready",
    task: "Trouver des clients",
    tools: "CRM",
    process: "Classique",
    need: "prospection",
    result: "May, à vos côtés.",
  },
  {
    name: "adapted",
    task: "Trouver des clients",
    tools: "Logiciel métier",
    process: "Quelques spécificités",
    need: "prospection",
    result: "May, adaptée à vos règles.",
  },
  {
    name: "custom",
    task: "Autre chose",
    tools: "Logiciel métier",
    process: "Unique à notre métier",
    need: "custom",
    result: "Un agent sur mesure, autour de votre métier.",
  },
])
  test(`diagnostic ${scenario.name} produces a result and carries the answers to contact`, async ({
    page,
  }) => {
    await page.goto("/#comment-choisir");
    await answer(page, scenario.task);
    await answer(page, "2 à 10 h");
    await answer(page, scenario.tools);
    await answer(page, scenario.process, true);
    await expect(
      page.getByRole("heading", { name: scenario.result, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Parlons de ce résultat" }).click();
    await expect(page.locator("#mobile-contact-need")).toHaveValue(
      scenario.need,
    );
    await expect(page.getByText("Votre diagnostic est joint")).toBeVisible();
    await page
      .getByRole("button", { name: "Retirer le diagnostic de la demande" })
      .click();
    await expect(
      page.getByText("Votre diagnostic est joint"),
    ).not.toBeVisible();
  });

test("diagnostic back navigation preserves choices", async ({ page }) => {
  await page.goto("/#comment-choisir");
  await answer(page, "Créer du contenu");
  await page
    .locator("#comment-choisir")
    .getByRole("button", { name: "Retour", exact: true })
    .click();
  await expect(
    page.getByLabel("Créer du contenu", { exact: false }),
  ).toBeChecked();
});

test("reception preserves the visitor's question in the contact form", async ({
  page,
}) => {
  // The reception is May's chat (since 22/09): what the visitor wrote to her reaches the contact form.
  await page.goto("/#mission");
  await page
    .getByLabel("Votre message à May", { exact: true })
    .fill("Comment automatiser mes relances commerciales ?");
  await page
    .getByRole("button", { name: "Être recontacté par l’équipe" })
    .click();
  await expect(page.locator("#mobile-contact-message")).toHaveValue(
    /Comment automatiser mes relances commerciales \?/,
  );
});

test("form validates, keeps values after failure and only confirms a successful response", async ({
  page,
}) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.locator("#mobile-contact-name")).toBeFocused();
  await expect(page.locator("#mobile-contact-consent")).not.toBeChecked();
  await page.getByLabel("Nom et prénom", { exact: true }).fill("Camille Test");
  await page
    .getByLabel("E-mail professionnel", { exact: true })
    .fill("camille@example.test");
  await page.getByLabel("Entreprise", { exact: true }).fill("Entreprise Test");
  await page
    .getByLabel("Votre projet", { exact: true })
    .fill("Je souhaite automatiser le suivi de mes demandes clients.");
  await page.locator("#mobile-contact-consent").check();
  let attempt = 0;
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/contact", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: attempt++ === 0 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(attempt === 1 ? { ok: false } : { ok: true }),
    });
  });
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.locator("#contact").getByRole("alert")).toContainText(
    "n’a pas pu être transmise",
  );
  await expect(page.locator("#mobile-contact-email")).toHaveValue(
    "camille@example.test",
  );
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Merci Camille, votre demande est envoyée.",
    }),
  ).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toMatchObject({
    consent: true,
    source: "mobile-direct",
    email: "camille@example.test",
    website: "",
  });
});
