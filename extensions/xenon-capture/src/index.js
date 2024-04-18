import {register} from "@shopify/web-pixels-extension";

register((api) => {
    // Set a cookie example
    api.browser.cookie.set('app_name', 'xenon-capture');

    // Subscribe to standard events
    api.analytics.subscribe('all_standard_events', (event) => {
      console.log('xenon-capture event:', event);
      console.log('xenon-capture init:', api.init);
    });

    // Subscribe to xenon events (can also subscribe to all_custom_events)
    api.analytics.subscribe('xenon', (event) => {
      const timing = JSON.parse(event.customData.timing);
      console.log('xenon-capture timing:', timing);
      console.log('xenon-capture settings:', api.settings);
    });
});
