# LilTag

**LilTag** is a simple JavaScript tag management system that dynamically loads and runs scripts on your website based
on the rules you set. With just 250 lines of code, LilTag uses a simple JSON file to store tags, operates without
cookies, and doesn’t track users, ensuring your website remains fully GDPR compliant.

![Liltag](images/liltag.jpg)

## Features

- **Dynamic Script Injection**: Load scripts dynamically based on various triggers.
- **Customizable Loading**: Control where the content gets injected into the DOM (head, body top, or body bottom).
- **Event-Based Triggers**: Supports triggers such as page load, DOM ready, custom events, and more.
- **Caching**: Optional caching with customizable TTL (time-to-live) for the configurations.


## Installation

Include LilTag in your project:

### Example of Including LilTag (Deferred Loading)

```html
<script src="//dmitry2080.github.io/liltag/dist/liltag.min.js" defer></script>
<script>
  const lilTag = new LilTag("path_or_url/to/liltag_config.json");
  lilTag.init();
</script>
```

### Example of Including LilTag (Asynchronous Loading)
If you want to load LilTag asynchronously and initialize it only after the script has fully loaded, you can use the following approach:

```html
<script>
  (function () {
    const script = document.createElement("script");
    script.src = "//dmitry2080.github.io/liltag/dist/liltag.min.js";
    script.async = true;
    script.onload = function () {
      const lilTag = new LilTag("path_or_url/to/liltag_config.json");
      lilTag.init();
    };
    document.head.appendChild(script);
  })();
</script>
```

## Usage

### Loading Configuration

#### 1. Loading Configuration from a URL
You can initialize LilTag by providing a URL to a JSON configuration file. The configuration file should contain the tags you want to inject into your web page.

```javascript
const lilTag = new LilTag("path_or_url/to/liltag_config.json");
lilTag.init();
```

##### JSON Configuration Example
```json
{
  "tags": [
    {
      "id": "analytics",
      "trigger": "pageLoad",
      "content": "<script type=\"text/javascript\">console.log('Analytics script loaded.');</script>",
      "location": "head"
    }
  ]
}
```

#### 2. Providing the Configuration Directly

If you prefer to provide the configuration directly within your code, you can pass it as an object.

```javascript
const lilTag = new LilTag({
  "tags": [
    {
      "id": "analytics",
      "trigger": "pageLoad",
      "content": "<script type=\"text/javascript\">console.log('Analytics script loaded.');</script>",
      "location": "head"
    }
  ]
});
lilTag.init();
```

### Enabling Caching

You can enable caching to avoid fetching the configuration on every page load. The enableCache() method allows you to specify a TTL (time-to-live) in seconds.
    
```javascript 
// Enable caching with a TTL of 2 hours (7200 seconds)
const lilTag = new LilTag('path_or_url/to/liltag_config.json');
lilTag.enableCache(7200);
lilTag.init();
```

### Debug Logging

By default LilTag stays quiet in the console (it only emits warnings and errors).
Call `enableDebug()` before `init()` to turn on verbose logging while developing.

```javascript
const lilTag = new LilTag('path_or_url/to/liltag_config.json');
lilTag.enableDebug();
lilTag.init();
```

## Configuration Options
Each tag in the configuration file or object should have the following properties:

- **id**: A unique identifier for the tag.
- **trigger**: The event that triggers the tag. Options are:
  - "pageLoad": Triggered when the page loads.
  - "domReady": Triggered when the DOM is fully loaded and parsed.
  - "timeDelay": Triggered after a specified delay once the page has loaded.
  - "elementVisible": Triggered when a specified element becomes visible in the viewport.
  - "customEvent": Triggered when a custom event is fired.
- **content**: The full HTML content to inject, including script and noscript tags.
- **location**: Where to inject the script or execute the code. Options are:
  - "head": Injects the script or code into the <head> of the document.
  - "bodyTop": Injects the script or code at the top of the <body>.
  - "bodyBottom": Injects the script or code at the bottom of the <body>.
- **delay**: (Optional) Used with the "timeDelay" trigger to specify the delay in milliseconds before the script or code is executed.
- **selector**: (Optional) A CSS selector for the element to observe. Required for the "elementVisible" trigger.
- **eventName**: (Optional) The name of the custom event to listen for. Required for the "customEvent" trigger.

## Contributing

Contributions are welcome! Please submit a pull request or create an issue to discuss your ideas or report bugs.
