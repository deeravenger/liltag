import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LilTag from "../src/liltag";

function resetDom(): void {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
}

describe("LilTag – direct config injection", () => {
    beforeEach(() => {
        resetDom();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        resetDom();
    });

    it("injects content into the head on pageLoad", () => {
        const lilTag = new LilTag({
            tags: [
                {
                    id: "analytics",
                    trigger: "pageLoad" as any,
                    content: "<div id=\"injected\">hi</div>",
                    location: "head" as any,
                },
            ],
        });

        lilTag.init();

        const injected = document.head.querySelector("#injected");
        expect(injected).not.toBeNull();
        expect(injected?.getAttribute("data-tag-id")).toBe("analytics");
    });

    it("injects at the top of the body for bodyTop", () => {
        document.body.innerHTML = "<p id=\"existing\">existing</p>";

        new LilTag({
            tags: [
                {
                    id: "top",
                    trigger: "pageLoad" as any,
                    content: "<span id=\"first\">first</span>",
                    location: "bodyTop" as any,
                },
            ],
        }).init();

        expect(document.body.firstElementChild?.id).toBe("first");
    });

    // Scripts inserted through innerHTML are inert; LilTag must recreate every
    // <script> (top-level and nested) via document.createElement so the browser
    // executes them. jsdom under vitest does not run injected scripts, so we
    // assert the structural revival (real <script> elements, content + attributes
    // preserved) — the exact code path that makes execution possible in a browser.
    it("recreates top-level and nested <script> elements, preserving content and attributes", () => {
        new LilTag({
            tags: [
                {
                    id: "scripts",
                    trigger: "pageLoad" as any,
                    content:
                        "<script data-role=\"top\">var a = 1;</script>" +
                        "<div><script data-role=\"nested\">var b = 2;</script></div>",
                    location: "bodyBottom" as any,
                },
            ],
        }).init();

        const topScript = document.querySelector("script[data-role=\"top\"]") as HTMLScriptElement;
        const nestedScript = document.querySelector("div script[data-role=\"nested\"]") as HTMLScriptElement;

        expect(topScript).not.toBeNull();
        expect(topScript.textContent).toBe("var a = 1;");
        expect(topScript.getAttribute("data-tag-id")).toBe("scripts");

        expect(nestedScript).not.toBeNull();
        expect(nestedScript.textContent).toBe("var b = 2;");
        expect(nestedScript.parentElement?.tagName.toLowerCase()).toBe("div");
    });

    it("does not inject the same tag twice", () => {
        const config = {
            tags: [
                {
                    id: "dup",
                    trigger: "pageLoad" as any,
                    content: "<div class=\"dup\">x</div>",
                    location: "bodyBottom" as any,
                },
            ],
        };

        new LilTag(config).init();
        new LilTag(config).init();

        expect(document.querySelectorAll("[data-tag-id=\"dup\"]").length).toBe(1);
    });

    it("warns and skips a tag with no valid id", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new LilTag({
            tags: [
                {
                    id: "",
                    trigger: "pageLoad" as any,
                    content: "<div>x</div>",
                    location: "head" as any,
                },
            ],
        }).init();

        expect(warn).toHaveBeenCalled();
        expect(document.head.children.length).toBe(0);
    });

    it("logs an error for a malformed config without a tags array", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

        new LilTag({} as any).init();

        expect(error).toHaveBeenCalled();
    });

    it("executes a timeDelay tag after the delay", () => {
        vi.useFakeTimers();
        try {
            new LilTag({
                tags: [
                    {
                        id: "delayed",
                        trigger: "timeDelay" as any,
                        content: "<div id=\"late\">late</div>",
                        location: "bodyBottom" as any,
                        delay: 500,
                    },
                ],
            }).init();

            expect(document.querySelector("#late")).toBeNull();
            vi.advanceTimersByTime(500);
            expect(document.querySelector("#late")).not.toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it("executes a customEvent tag when the event fires", () => {
        new LilTag({
            tags: [
                {
                    id: "evt",
                    trigger: "customEvent" as any,
                    content: "<div id=\"evt-content\">x</div>",
                    location: "bodyBottom" as any,
                    eventName: "my-event",
                },
            ],
        }).init();

        expect(document.querySelector("#evt-content")).toBeNull();
        document.dispatchEvent(new Event("my-event"));
        expect(document.querySelector("#evt-content")).not.toBeNull();
    });
});

describe("LilTag – caching", () => {
    beforeEach(() => {
        resetDom();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("caches a fetched config and serves it on the next init", async () => {
        const config = {
            tags: [
                {
                    id: "cached",
                    trigger: "pageLoad",
                    content: "<div class=\"cached\">x</div>",
                    location: "bodyBottom",
                },
            ],
        };

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(config),
        });
        vi.stubGlobal("fetch", fetchMock);

        const first = new LilTag("https://example.com/config.json");
        first.enableCache(3600);
        first.init();

        // Wait for the fetch promise chain to settle.
        await vi.waitFor(() => {
            expect(document.querySelector(".cached")).not.toBeNull();
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);

        resetDom();

        const second = new LilTag("https://example.com/config.json");
        second.enableCache(3600);
        second.init();

        // Served from cache synchronously, no second fetch.
        expect(document.querySelector(".cached")).not.toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("disables cache when given a non-positive TTL", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const lilTag = new LilTag("https://example.com/config.json");
        lilTag.enableCache(0);
        expect(warn).toHaveBeenCalled();
    });
});
