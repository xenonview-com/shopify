import {register} from "@shopify/web-pixels-extension";
import Xenon from 'xenon-view-sdk';

register((api) => {
  // See if debug is set
  const debug = api.settings.debug && (api.settings.debug === "1" || api.settings.debug.toLowerCase() === "true");

  // Register Xenon
  if (api.settings.apiKey) {
    Xenon.init(api.settings.apiKey);
    const xenonId = Xenon.id()
    api.browser.localStorage.setItem('xenonId', xenonId).then(() => {
      if (debug) {
        console.log('xenon-id:', xenonId);
      }
    });
  } else {
    console.log('Error: No Xenon API Key configured');
  }

  // Subscribe to standard events
  api.analytics.subscribe('all_standard_events', (event) => {
    if (debug) {
      console.log('xenon-capture event:', event);
      console.log('xenon-capture init:', api.init);
    }
  });

  // Subscribe to xenon events (can also subscribe to all_custom_events)
  api.analytics.subscribe('xenon', (event) => {
    const timing = JSON.parse(event.customData.timing);
    if (debug) {
      console.log('xenon-capture timing:', timing);
      console.log('xenon-capture settings:', api.settings);
    }
  });
});
