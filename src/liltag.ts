enum Trigger {
    PageLoad = "pageLoad",
    DomReady = "domReady",
    TimeDelay = "timeDelay",
    ElementVisible = "elementVisible",
    CustomEvent = "customEvent"
}

enum ContentLocation {
    Head = "head",
    BodyTop = "bodyTop",
    BodyBottom = "bodyBottom"
}

interface TagConfig {
    id: string;
    trigger: Trigger;
    content: string;  // Full HTML content, including <script>, <noscript>, etc.
    location: ContentLocation;
    delay?: number;   // Used with "timeDelay" trigger
    selector?: string;  // Used with "elementVisible" trigger
    eventName?: string;  // Used with "customEvent" trigger
}

interface Config {
    tags: TagConfig[];
}

export default class LilTag {
    private static readonly DATA_ATTRIBUTE = "data-tag-id";
    private static readonly CACHE_KEY = "LILTAG_CACHE";
    private static readonly CACHE_DEFAULT_TTL = 3600;
    private cacheEnabled: boolean = false;
    private cacheTTL: number = LilTag.CACHE_DEFAULT_TTL;
    private debug: boolean = false;

    constructor(private config: Config | string) {}

    public enableCache(ttl: number = LilTag.CACHE_DEFAULT_TTL): void {
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
    public enableDebug(enabled: boolean = true): void {
        this.debug = enabled;
    }

    public init(): void {
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
        } else {
            this.processConfig(this.config);
        }
    }

    private log(message: string): void {
        if (this.debug) {
            console.log(`LilTag: ${message}`);
        }
    }

    private fetchAndCacheConfig(url: string): void {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.statusText})`);
                }
                return response.json();
            })
            .then((config: Config) => {
                if (this.cacheEnabled) {
                    this.cacheConfig(url, config);
                }
                this.processConfig(config);
            })
            .catch(error => console.error("Error loading configuration:", error));
    }

    private cacheConfig(url: string, config: Config): void {
        const cacheData = this.getCacheData();
        cacheData[url] = {
            config: config,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            // localStorage may be unavailable (private mode, disabled, quota exceeded).
            console.warn("LilTag could not write to localStorage. Caching is disabled for this run.", error);
        }
    }

    private getCachedConfig(url: string): Config | null {
        const cacheData = this.getCacheData();
        const cachedEntry = cacheData[url];
        if (!cachedEntry) return null;

        const ttlInMilliseconds = this.cacheTTL * 1000;

        if (Date.now() - cachedEntry.timestamp > ttlInMilliseconds) {
            delete cacheData[url];
            try {
                localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
            } catch (error) {
                console.warn("LilTag could not update localStorage while pruning expired cache.", error);
            }
            return null;
        }

        return cachedEntry.config;
    }

    private getCacheData(): { [key: string]: { config: Config, timestamp: number } } {
        let cacheData: string | null = null;
        try {
            cacheData = localStorage.getItem(LilTag.CACHE_KEY);
        } catch (error) {
            console.warn("LilTag could not read from localStorage.", error);
            return {};
        }

        if (cacheData) {
            try {
                return JSON.parse(cacheData);
            } catch (error) {
                console.error("Error parsing cache data:", error);
                try {
                    localStorage.removeItem(LilTag.CACHE_KEY);
                } catch {
                    /* ignore */
                }
                return {};
            }
        }
        return {};
    }

    private processConfig(config: Config): void {
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
                    } else {
                        window.addEventListener("load", () => this.executeTag(tag), { once: true });
                    }
                    break;
                case Trigger.DomReady:
                    if (document.readyState === "interactive" || document.readyState === "complete") {
                        this.executeTag(tag);
                    } else {
                        document.addEventListener("DOMContentLoaded", () => this.executeTag(tag), { once: true });
                    }
                    break;
                case Trigger.TimeDelay:
                    if (tag.delay !== undefined) {
                        const delay = Number(tag.delay);
                        if (isNaN(delay) || delay < 0) {
                            console.warn(`Invalid delay value for tag "${tag.id}". Skipping execution.`);
                        } else {
                            setTimeout(() => this.executeTag(tag), delay);
                        }
                    } else {
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
                    } else {
                        console.warn(`No selector specified for ElementVisible trigger in tag "${tag.id}".`);
                    }
                    break;
                case Trigger.CustomEvent:
                    if (tag.eventName) {
                        const listener = () => {
                            this.executeTag(tag);
                            document.removeEventListener(tag.eventName!, listener);
                        };
                        document.addEventListener(tag.eventName, listener);
                    } else {
                        console.warn(`No eventName specified for CustomEvent trigger in tag "${tag.id}".`);
                    }
                    break;
                default:
                    console.warn(`Unknown trigger type: ${tag.trigger}`);
            }
        });
    }

    private isValidTag(tag: TagConfig): boolean {
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

    private executeTag(tag: TagConfig): void {
        try {
            this.injectContent(tag.content, tag.location, tag.id);
        } catch (error) {
            console.error(`Error executing tag "${tag.id}":`, error);
        }
    }

    private injectContent(content: string, location: ContentLocation, tagId: string): void {
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
                const element = node as HTMLElement;
                element.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);
                fragment.appendChild(this.reviveScripts(element));
            } else {
                fragment.appendChild(node.cloneNode(true));
            }
        });

        const { node: anchor, position } = target;
        if (position === "prepend") {
            anchor.insertBefore(fragment, anchor.firstChild);
        } else {
            anchor.appendChild(fragment);
        }
    }

    private resolveTarget(location: ContentLocation): { node: HTMLElement, position: "append" | "prepend" } | null {
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
    private reviveScripts(node: Node): Node {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === "script") {
            return this.recreateScript(node as HTMLScriptElement);
        }

        const clone = node.cloneNode(false);

        if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(child => {
                clone.appendChild(this.reviveScripts(child));
            });
        }

        return clone;
    }

    private recreateScript(source: HTMLScriptElement): HTMLScriptElement {
        const script = document.createElement("script");
        Array.from(source.attributes).forEach(attr => {
            script.setAttribute(attr.name, attr.value);
        });
        script.text = source.textContent || "";
        return script;
    }
}

/**
 * Minimal CSS.escape fallback for environments where it is unavailable.
 * Only used to safely embed a tag id inside an attribute selector.
 */
function cssEscape(value: string): string {
    const escaper = (typeof CSS !== "undefined" && typeof CSS.escape === "function")
        ? CSS.escape
        : (v: string) => v.replace(/["\\\]]/g, "\\$&");
    return escaper(value);
}
