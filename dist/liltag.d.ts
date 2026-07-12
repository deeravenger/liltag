declare enum Trigger {
    PageLoad = "pageLoad",
    DomReady = "domReady",
    TimeDelay = "timeDelay",
    ElementVisible = "elementVisible",
    CustomEvent = "customEvent"
}
declare enum ContentLocation {
    Head = "head",
    BodyTop = "bodyTop",
    BodyBottom = "bodyBottom"
}
interface TagConfig {
    id: string;
    trigger: Trigger;
    content: string;
    location: ContentLocation;
    delay?: number;
    selector?: string;
    eventName?: string;
}
interface Config {
    tags: TagConfig[];
}
export default class LilTag {
    private config;
    private static readonly DATA_ATTRIBUTE;
    private static readonly CACHE_KEY;
    private static readonly CACHE_DEFAULT_TTL;
    private cacheEnabled;
    private cacheTTL;
    private debug;
    constructor(config: Config | string);
    enableCache(ttl?: number): void;
    /**
     * Enable verbose logging. When disabled (default), LilTag stays silent in the
     * console except for warnings and errors.
     */
    enableDebug(enabled?: boolean): void;
    init(): void;
    private log;
    private fetchAndCacheConfig;
    private cacheConfig;
    private getCachedConfig;
    private getCacheData;
    private processConfig;
    private isValidTag;
    private executeTag;
    private injectContent;
    private resolveTarget;
    /**
     * Returns a clone of the node in which every <script> (including nested ones)
     * is recreated so the browser executes it. Scripts inserted via innerHTML are
     * inert, so they must be rebuilt with document.createElement.
     */
    private reviveScripts;
    private recreateScript;
}
export {};
