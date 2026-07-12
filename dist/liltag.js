(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["LilTag"] = factory();
	else
		root["LilTag"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
var Trigger;
(function (Trigger) {
    Trigger["PageLoad"] = "pageLoad";
    Trigger["DomReady"] = "domReady";
    Trigger["TimeDelay"] = "timeDelay";
    Trigger["ElementVisible"] = "elementVisible";
    Trigger["CustomEvent"] = "customEvent";
})(Trigger || (Trigger = {}));
var ContentLocation;
(function (ContentLocation) {
    ContentLocation["Head"] = "head";
    ContentLocation["BodyTop"] = "bodyTop";
    ContentLocation["BodyBottom"] = "bodyBottom";
})(ContentLocation || (ContentLocation = {}));
class LilTag {
    constructor(config) {
        this.config = config;
        this.cacheEnabled = false;
        this.cacheTTL = LilTag.CACHE_DEFAULT_TTL;
        this.debug = false;
    }
    enableCache(ttl = LilTag.CACHE_DEFAULT_TTL) {
        if (ttl <= 0) {
            console.warn(`LilTag cache TTL must be a positive number (${ttl} provided). Disabling cache.`);
            this.cacheEnabled = false;
            return;
        }
        this.cacheEnabled = true;
        this.cacheTTL = ttl;
    }
    /**
     * Enable verbose logging. When disabled (default), LilTag stays silent in the
     * console except for warnings and errors.
     */
    enableDebug(enabled = true) {
        this.debug = enabled;
    }
    init() {
        if (this.config === "") {
            console.warn("LilTag initialization skipped: empty string provided.");
            return;
        }
        if (typeof this.config === "string") {
            if (this.cacheEnabled) {
                const cachedConfig = this.getCachedConfig(this.config);
                if (cachedConfig) {
                    this.log("Using cached configuration.");
                    this.processConfig(cachedConfig);
                    return;
                }
            }
            this.fetchAndCacheConfig(this.config);
        }
        else {
            this.processConfig(this.config);
        }
    }
    log(message) {
        if (this.debug) {
            console.log(`LilTag: ${message}`);
        }
    }
    fetchAndCacheConfig(url) {
        fetch(url)
            .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (${response.statusText})`);
            }
            return response.json();
        })
            .then((config) => {
            if (this.cacheEnabled) {
                this.cacheConfig(url, config);
            }
            this.processConfig(config);
        })
            .catch(error => console.error("Error loading configuration:", error));
    }
    cacheConfig(url, config) {
        const cacheData = this.getCacheData();
        cacheData[url] = {
            config: config,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
        }
        catch (error) {
            // localStorage may be unavailable (private mode, disabled, quota exceeded).
            console.warn("LilTag could not write to localStorage. Caching is disabled for this run.", error);
        }
    }
    getCachedConfig(url) {
        const cacheData = this.getCacheData();
        const cachedEntry = cacheData[url];
        if (!cachedEntry)
            return null;
        const ttlInMilliseconds = this.cacheTTL * 1000;
        if (Date.now() - cachedEntry.timestamp > ttlInMilliseconds) {
            delete cacheData[url];
            try {
                localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
            }
            catch (error) {
                console.warn("LilTag could not update localStorage while pruning expired cache.", error);
            }
            return null;
        }
        return cachedEntry.config;
    }
    getCacheData() {
        let cacheData = null;
        try {
            cacheData = localStorage.getItem(LilTag.CACHE_KEY);
        }
        catch (error) {
            console.warn("LilTag could not read from localStorage.", error);
            return {};
        }
        if (cacheData) {
            try {
                return JSON.parse(cacheData);
            }
            catch (error) {
                console.error("Error parsing cache data:", error);
                try {
                    localStorage.removeItem(LilTag.CACHE_KEY);
                }
                catch (_a) {
                    /* ignore */
                }
                return {};
            }
        }
        return {};
    }
    processConfig(config) {
        if (!config || !Array.isArray(config.tags)) {
            console.error("LilTag: invalid configuration - expected an object with a \"tags\" array.");
            return;
        }
        config.tags.forEach(tag => {
            if (!this.isValidTag(tag)) {
                return;
            }
            switch (tag.trigger) {
                case Trigger.PageLoad:
                    if (document.readyState === "complete") {
                        this.executeTag(tag);
                    }
                    else {
                        window.addEventListener("load", () => this.executeTag(tag), { once: true });
                    }
                    break;
                case Trigger.DomReady:
                    if (document.readyState === "interactive" || document.readyState === "complete") {
                        this.executeTag(tag);
                    }
                    else {
                        document.addEventListener("DOMContentLoaded", () => this.executeTag(tag), { once: true });
                    }
                    break;
                case Trigger.TimeDelay:
                    if (tag.delay !== undefined) {
                        const delay = Number(tag.delay);
                        if (isNaN(delay) || delay < 0) {
                            console.warn(`Invalid delay value for tag "${tag.id}". Skipping execution.`);
                        }
                        else {
                            setTimeout(() => this.executeTag(tag), delay);
                        }
                    }
                    else {
                        console.warn(`No delay specified for TimeDelay trigger in tag "${tag.id}". Skipping execution.`);
                    }
                    break;
                case Trigger.ElementVisible:
                    if (tag.selector) {
                        if (typeof IntersectionObserver === "undefined") {
                            console.warn(`IntersectionObserver is not supported; executing tag "${tag.id}" immediately.`);
                            this.executeTag(tag);
                            break;
                        }
                        const observer = new IntersectionObserver((entries, observer) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    this.executeTag(tag);
                                    observer.disconnect();
                                }
                            });
                        });
                        document.querySelectorAll(tag.selector).forEach(element => observer.observe(element));
                    }
                    else {
                        console.warn(`No selector specified for ElementVisible trigger in tag "${tag.id}".`);
                    }
                    break;
                case Trigger.CustomEvent:
                    if (tag.eventName) {
                        const listener = () => {
                            this.executeTag(tag);
                            document.removeEventListener(tag.eventName, listener);
                        };
                        document.addEventListener(tag.eventName, listener);
                    }
                    else {
                        console.warn(`No eventName specified for CustomEvent trigger in tag "${tag.id}".`);
                    }
                    break;
                default:
                    console.warn(`Unknown trigger type: ${tag.trigger}`);
            }
        });
    }
    isValidTag(tag) {
        if (!tag || typeof tag.id !== "string" || tag.id === "") {
            console.warn("LilTag: skipping tag without a valid \"id\".");
            return false;
        }
        if (typeof tag.content !== "string") {
            console.warn(`LilTag: skipping tag "${tag.id}" - "content" must be a string.`);
            return false;
        }
        return true;
    }
    executeTag(tag) {
        try {
            this.injectContent(tag.content, tag.location, tag.id);
        }
        catch (error) {
            console.error(`Error executing tag "${tag.id}":`, error);
        }
    }
    injectContent(content, location, tagId) {
        if (!content) {
            console.warn(`Tag with ID "${tagId}" has no content to inject.`);
            return;
        }
        // Guard against double injection of the same tag.
        if (document.querySelector(`[${LilTag.DATA_ATTRIBUTE}="${cssEscape(tagId)}"]`)) {
            this.log(`Tag "${tagId}" is already present in the DOM. Skipping re-injection.`);
            return;
        }
        const target = this.resolveTarget(location);
        if (!target) {
            // document.body may not exist yet (e.g. script running in <head>).
            console.warn(`LilTag: injection target for location "${location}" is not available yet for tag "${tagId}".`);
            return;
        }
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content.trim();
        const fragment = document.createDocumentFragment();
        Array.from(tempDiv.childNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                element.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);
                fragment.appendChild(this.reviveScripts(element));
            }
            else {
                fragment.appendChild(node.cloneNode(true));
            }
        });
        const { node: anchor, position } = target;
        if (position === "prepend") {
            anchor.insertBefore(fragment, anchor.firstChild);
        }
        else {
            anchor.appendChild(fragment);
        }
    }
    resolveTarget(location) {
        switch (location) {
            case ContentLocation.Head:
                return document.head ? { node: document.head, position: "append" } : null;
            case ContentLocation.BodyTop:
                return document.body ? { node: document.body, position: "prepend" } : null;
            case ContentLocation.BodyBottom:
                return document.body ? { node: document.body, position: "append" } : null;
            default:
                console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                return document.body ? { node: document.body, position: "append" } : null;
        }
    }
    /**
     * Returns a clone of the node in which every <script> (including nested ones)
     * is recreated so the browser executes it. Scripts inserted via innerHTML are
     * inert, so they must be rebuilt with document.createElement.
     */
    reviveScripts(node) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "script") {
            return this.recreateScript(node);
        }
        const clone = node.cloneNode(false);
        if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(child => {
                clone.appendChild(this.reviveScripts(child));
            });
        }
        return clone;
    }
    recreateScript(source) {
        const script = document.createElement("script");
        Array.from(source.attributes).forEach(attr => {
            script.setAttribute(attr.name, attr.value);
        });
        script.text = source.textContent || "";
        return script;
    }
}
LilTag.DATA_ATTRIBUTE = "data-tag-id";
LilTag.CACHE_KEY = "LILTAG_CACHE";
LilTag.CACHE_DEFAULT_TTL = 3600;
exports["default"] = LilTag;
/**
 * Minimal CSS.escape fallback for environments where it is unavailable.
 * Only used to safely embed a tag id inside an attribute selector.
 */
function cssEscape(value) {
    const escaper = (typeof CSS !== "undefined" && typeof CSS.escape === "function")
        ? CSS.escape
        : (v) => v.replace(/["\\\]]/g, "\\$&");
    return escaper(value);
}

})();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=liltag.js.map