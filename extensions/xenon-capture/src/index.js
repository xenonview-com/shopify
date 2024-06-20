import {register} from '@shopify/web-pixels-extension';
import Xenon from 'xenon-view-sdk';
import { version } from '../../../package.json';

const logError = (message) => {
  console.log('xenon-capture:%c Error: '+ message, 'color: #ff0000');
}


/**
 * Called on every page load
 */
register((api) => {
  // See if debug is set
  const debug = api.settings.debug && (api.settings.debug === "1" || api.settings.debug.toLowerCase() === "true");
  const purachaseOnly = api.settings.purachaseOnly && (api.settings.purachaseOnly === "1" || api.settings.purachaseOnly.toLowerCase() === "true");
  const logDebug = (name, ...args) => {
    if (debug) console.log('%c'+ name, 'color: #3333cc', ...args);
  }

  // Make sure we have an API Key
  if (api.settings.apiKey) {
    Xenon.init(api.settings.apiKey, null, (err) => {
      logError(err.message)
    });
    Xenon.ecomAbandonment();
  } else {
    logError('No API Key configured');
  }
  //logDebug('Xenon app settings', api.settings);

  // Subscribe to all events (standard, dom, custom)
  api.analytics.subscribe('all_events', (event) => {
    switch(event.name) {
      case 'collection_viewed':
        if (!purachaseOnly) {
          Xenon.contentViewed('Collection', event.data.collection.title);
          logDebug('Xenon.contentViewed', 'Collection', event.data.collection.title);
        }
        break;
      case 'checkout_contact_info_submitted':
        const person = {
          email: event.data.checkout.email,
          name: [event.data.checkout.billingAddress.firstName, event.data.checkout.billingAddress.lastName].join(' ')
        };
        if (purachaseOnly) {
          Xenon.milestone('Checkout', 'Contact', person.name, person.email);
          logDebug('Xenon.milestone', 'Checkout','Contact', person.name, person.email);
          Xenon.heartbeat();
        } else {
          Xenon.deanonymize(person).then(() => {
            Xenon.heartbeat();
          });
          logDebug('Xenon.deanonymize', person);
        }
        break;
      case 'checkout_shipping_info_submitted':
        Xenon.contentCreated('shipping');
        logDebug('Xenon.contentCreated','shipping');
        Xenon.heartbeat();
        break;
      case 'payment_info_submitted':
        Xenon.contentCreated('billing');
        logDebug('Xenon.contentCreated','billing');
        Xenon.heartbeat();
        break;
      case 'product_added_to_cart':
        if (!purachaseOnly) {
          Xenon.productAddedToCart(event.data.cartLine.merchandise.product.id);
          logDebug('Xenon.productAddedToCart', event.data.cartLine.merchandise.product.id);
          Xenon.heartbeat();
        }
        break;
      case 'product_removed_from_cart':
        if (!purachaseOnly) {
          Xenon.productRemoved(event.data.cartLine.merchandise.product.id);
          logDebug('Xenon.productRemoved', event.data.cartLine.merchandise.product.id);
          if (api.init.data.cart.totalQuantity === 0) {
            // cart is empty
            Xenon.cancelAbandonment();
            logDebug('Xenon.cancelAbandonment');
          }
          Xenon.heartbeat();
        }
        break;
      case 'checkout_completed':
        // Payment flow (basic or express) - TBD - currently summary_pay_button milestone recorded
        /// Xenon.milestone('Selection','Payment', 'Flow', paymentFlow);

        event.data.checkout.transactions.map((transaction) => {
          Xenon.milestone('Selection', 'Payment', 'Used', transaction.gateway);
          logDebug('Xenon.milestone', 'Selection','Payment', 'Used', transaction.gateway);
        });
        // Purchase details
        const skus = event.data.checkout.lineItems.map(item => item.id);
        const total = event.data.checkout.totalPrice.amount;
        Xenon.purchase(skus, total);
        logDebug('Xenon.purchase', skus, total);
        Xenon.heartbeat();
        break;
      case 'clicked':
        if (event.data.element.tagName !== 'INPUT') {
          const cl = event.data.element.tagName.charAt(0) + event.data.element.tagName.slice(1).toLowerCase() +
            event.data.element.type.charAt(0).toUpperCase() + event.data.element.type.slice(1);
          Xenon.milestone(cl, event.data.element.id, event.type, event.data.element.value);
          logDebug('Xenon.milestone', cl, event.data.element.id, event.type, event.data.element.value);
          Xenon.heartbeat();
        }
        break;
      case 'input_blurred':
      case 'input_focused':
        // Not needed
        break;
      case 'input_changed':
        // Capture shipping method, discount coupon, or any other form data
        const ic = event.data.element.tagName.charAt(0) + event.data.element.tagName.slice(1).toLowerCase() +
          event.data.element.type.charAt(0).toUpperCase() + event.data.element.type.slice(1);
        Xenon.milestone(ic, event.data.element.id, event.type, event.data.element.value)
        logDebug('Xenon.milestone', ic, event.data.element.id, event.type, event.data.element.value);
        Xenon.heartbeat();
        break;
      case 'xenon_link':
        Xenon.milestone('Link', event.customData.id, event.customData.href, event.customData.text);
        logDebug('Xenon.milestone', 'Link', event.customData.id, event.customData.href, event.customData.text);
        Xenon.heartbeat();
        break;
      case 'xenon_input':
        const xi = 'Input' + event.customData.type.charAt(0).toUpperCase() + event.customData.type.slice(1);
        Xenon.milestone(xi, event.customData.id, event.customData.class, event.customData.text);
        logDebug('Xenon.milestone', xi, event.customData.id, event.customData.class, event.customData.text);
        Xenon.heartbeat();
        break;
      case 'xenon_button':
        const xb = 'Button' + event.customData.type.charAt(0).toUpperCase() + event.customData.type.slice(1);
        Xenon.milestone(xb, event.customData.id, event.customData.class, event.customData.text);
        logDebug('Xenon.milestone', xb, event.customData.id, event.customData.class, event.customData.text);
        Xenon.heartbeat();
        break;
      case 'page_viewed':
        // duplicates xenon_timing
        break;
      case 'xenon_timing':
        api.browser.sessionStorage.getItem('xenon-platform').then((p) => {
          Xenon.pageLoadTime(event.customData.loadTime.toString(), event.customData.href);
          logDebug('Xenon.pageLoadTime:', event.customData.loadTime, event.customData.href);
          if (!p) {
            // Configure platform
            Xenon.platform(version, 'Pixel', event.customData.platform, api.init.context.navigator.userAgent);
            logDebug('Xenon.platform', version, 'Pixel', event.customData.platform, api.init.context.navigator.userAgent)
            api.browser.sessionStorage.setItem('xenon-platform', event.customData.platform);
          }
          Xenon.heartbeat();
        });
        break;
      default:
        if (debug) {
          console.log('%cXenon unmapped:', 'color: #ff8c00', event);
        }
    }
  });
});
