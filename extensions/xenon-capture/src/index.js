import {register} from '@shopify/web-pixels-extension';
import Xenon from 'xenon-view-sdk';

const logError = (message) => {
  console.log('xenon-capture:%c Error: '+ message, 'color: #ff0000');
}


/**
 * Called on every page load
 */
register((api) => {
  // See if debug is set
  const debug = api.settings.debug && (api.settings.debug === "1" || api.settings.debug.toLowerCase() === "true");
  const logDebug = (name, ...args) => {
    if (debug) console.log('%c'+ name, 'color: #3333cc', ...args);
  }

  // Make sure we have an API Key
  if (api.settings.apiKey) {
    Xenon.init(api.settings.apiKey, null, (err) => {
      logError(err.message)
    });
  } else {
    logError('No API Key configured');
  }
  logDebug('Xenon app settings', api.settings);

  // Subscribe to all events (standard, dom, custom)
  api.analytics.subscribe('all_events', (event) => {
    switch(event.name) {
      case 'checkout_contact_info_submitted':
        const person = {
          email: event.data.checkout.email,
          name: [event.data.checkout.billingAddress.firstName, event.data.checkout.billingAddress.lastName].join(' ')
        };
        Xenon.deanonymize(person).then(() => {
          Xenon.heartbeat();
        });
        logDebug('Xenon.deanonymize', person);
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
        Xenon.productAddedToCart(event.data.cartLine.merchandise.product.id);
        logDebug('Xenon.productAddedToCart', event.data.cartLine.merchandise.product.id);
        Xenon.heartbeat();
        break;
      case 'product_removed_from_cart':
        Xenon.productRemoved(event.data.cartLine.merchandise.product.id);
        logDebug('Xenon.productRemoved', event.data.cartLine.merchandise.product.id);
        Xenon.heartbeat();
        break;
      case 'checkout_completed':
        // Payment flow (basic or express)
        Xenon.milestone('Selection','Payment', 'Flow', paymentFlow);
        Xenon.heartbeat();
        logDebug('Xenon.milestone', 'Selection','Payment', 'Flow', paymentFlow);
        // Payment method (there can be multiple transactions)
        event.data.checkout.transactions.map((transaction) => {
          Xenon.milestone('Selection', 'Payment', 'Used', transaction.gateway)
          logDebug('Xenon.milestone', 'Selection','Payment', 'Used', transaction.gateway);
        });
        Xenon.heartbeat();
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
      case 'xenon_timing':
        Xenon.pageLoadTime(event.customData.loadTime.toString(), event.customData.href);
        logDebug('Xenon.pageLoadTime:', event.customData);
        Xenon.heartbeat();
        break;
      default:
        if (debug) {
          console.log('%cXenon unmapped:', 'color: #dd571c', event);
        }
    }
  });
});
