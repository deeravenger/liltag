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
/*!***********************!*\
  !*** ./src/liltag.ts ***!
  \***********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
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
    init() {
        if (this.config === "") {
            console.warn("LilTag initialization skipped: empty string provided.");
            return;
        }
        if (typeof this.config === "string") {
            if (this.cacheEnabled) {
                const cachedConfig = this.getCachedConfig(this.config);
                if (cachedConfig) {
                    console.log("Using cached configuration.");
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
        localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
    }
    getCachedConfig(url) {
        const cacheData = this.getCacheData();
        const cachedEntry = cacheData[url];
        if (!cachedEntry)
            return null;
        const ttlInMilliseconds = this.cacheTTL * 1000;
        if (Date.now() - cachedEntry.timestamp > ttlInMilliseconds) {
            delete cacheData[url];
            localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
            return null;
        }
        return cachedEntry.config;
    }
    getCacheData() {
        const cacheData = localStorage.getItem(LilTag.CACHE_KEY);
        if (cacheData) {
            try {
                return JSON.parse(cacheData);
            }
            catch (error) {
                console.error("Error parsing cache data:", error);
                localStorage.removeItem(LilTag.CACHE_KEY);
                return {};
            }
        }
        return {};
    }
    processConfig(config) {
        config.tags.forEach(tag => {
            switch (tag.trigger) {
                case Trigger.PageLoad:
                    if (document.readyState === "complete") {
                        this.executeTag(tag);
                    }
                    else {
                        window.addEventListener("load", () => this.executeTag(tag));
                    }
                    break;
                case Trigger.DomReady:
                    if (document.readyState === "interactive" || document.readyState === "complete") {
                        this.executeTag(tag);
                    }
                    else {
                        document.addEventListener("DOMContentLoaded", () => this.executeTag(tag));
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
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content.trim();
        const fragment = document.createDocumentFragment();
        tempDiv.childNodes.forEach(node => {
            const clonedNode = node.cloneNode(true);
            if (clonedNode.nodeType === Node.ELEMENT_NODE) {
                const element = clonedNode;
                element.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);
                if (element.tagName.toLowerCase() === 'script') {
                    const script = document.createElement('script');
                    // Copy attributes
                    Array.from(element.attributes).forEach(attr => {
                        script.setAttribute(attr.name, attr.value);
                    });
                    // Copy inline script content
                    script.text = element.textContent || '';
                    fragment.appendChild(script);
                }
                else {
                    fragment.appendChild(element);
                }
            }
            else {
                fragment.appendChild(clonedNode);
            }
        });
        switch (location) {
            case ContentLocation.Head:
                document.head.appendChild(fragment);
                break;
            case ContentLocation.BodyTop:
                document.body.insertBefore(fragment, document.body.firstChild);
                break;
            case ContentLocation.BodyBottom:
                document.body.appendChild(fragment);
                break;
            default:
                console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                document.body.appendChild(fragment);
        }
    }
}
LilTag.DATA_ATTRIBUTE = "data-tag-id";
LilTag.CACHE_KEY = "LILTAG_CACHE";
LilTag.CACHE_DEFAULT_TTL = 3600;
exports["default"] = LilTag;

})();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});