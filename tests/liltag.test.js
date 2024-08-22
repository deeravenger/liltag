import { JSDOM } from "jsdom";
import { LilTag, Trigger, ScriptLocation } from "./liltag";

describe('LilTag', () => {
    let dom: JSDOM;

    beforeEach(() => {
        // Create a new JSDOM instance before each test to simulate a browser environment
        dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><div id="content"></div></body></html>`, {
            url: "http://localhost",
            runScripts: "dangerously",
            resources: "usable"
        });
        global.document = dom.window.document;
        global.window = dom.window as any;
    });

    afterEach(() => {
        // Clean up the global document and window after each test
        global.document = undefined!;
        global.window = undefined!;
    });

    test('should load script on pageLoad trigger', () => {
        const scriptUrl = "https://example.com/script.js";

        const config = {
            tags: [
                {
                    id: "testTag",
                    trigger: Trigger.PageLoad,
                    script: scriptUrl,
                    location: ScriptLocation.Head
                }
            ]
        };

        const lilTag = new LilTag(config);
        lilTag.init();

        const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
        expect(scriptElement).not.toBeNull();
    });

    test('should execute code on pageLoad trigger', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const code = "console.log('Code executed!');";

        const config = {
            tags: [
                {
                    id: "testCode",
                    trigger: Trigger.PageLoad,
                    code: code,
                    location: ScriptLocation.BodyBottom
                }
            ]
        };

        const lilTag = new LilTag(config);
        lilTag.init();

        expect(consoleSpy).toHaveBeenCalledWith('Code executed!');
        consoleSpy.mockRestore();
    });

    test('should execute script after timeDelay trigger', done => {
        const scriptUrl = "https://example.com/delayedScript.js";

        const config = {
            tags: [
                {
                    id: "delayedTag",
                    trigger: Trigger.TimeDelay,
                    script: scriptUrl,
                    location: ScriptLocation.BodyBottom,
                    delay: 1000 // 1 second delay
                }
            ]
        };

        const lilTag = new LilTag(config);
        lilTag.init();

        setTimeout(() => {
            const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
            expect(scriptElement).not.toBeNull();
            done();
        }, 1100); // Allow some buffer time to ensure the delay has passed
    });

    test('should load script when element becomes visible', done => {
        const scriptUrl = "https://example.com/visibleScript.js";
        const selector = "#content";

        const config = {
            tags: [
                {
                    id: "visibleTag",
                    trigger: Trigger.ElementVisible,
                    script: scriptUrl,
                    location: ScriptLocation.BodyBottom,
                    selector: selector
                }
            ]
        };

        const lilTag = new LilTag(config);
        lilTag.init();

        const contentDiv = global.document.querySelector(selector);
        contentDiv!.style.display = "block";

        // Simulate the element becoming visible
        setTimeout(() => {
            const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
            expect(scriptElement).not.toBeNull();
            done();
        }, 100);
    });

    test('should execute code on customEvent trigger', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const code = "console.log('Custom event triggered!');";
        const eventName = "customEvent";

        const config = {
            tags: [
                {
                    id: "customEventTag",
                    trigger: Trigger.CustomEvent,
                    code: code,
                    location: ScriptLocation.BodyBottom,
                    eventName: eventName
                }
            ]
        };

        const lilTag = new LilTag(config);
        lilTag.init();

        // Simulate the custom event
        const event = new global.window.Event(eventName);
        global.document.dispatchEvent(event);

        expect(consoleSpy).toHaveBeenCalledWith('Custom event triggered!');
        consoleSpy.mockRestore();
    });
});