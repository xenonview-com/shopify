import {register} from "@shopify/web-pixels-extension";

register(({ configuration, analytics, browser }) => {
    // Bootstrap and insert pixel script tag here

    // Sample subscribe to page view
    analytics.subscribe('all_events', (event) => {
      console.log('xenon-capture', event);
    });
});
