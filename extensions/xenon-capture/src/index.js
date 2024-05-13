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

  // Make sure we have an API Key
  if (api.settings.apiKey) {
    Xenon.init(api.settings.apiKey, null, (err) => {
      logError(err.message)
    });
  } else {
    logError('No API Key configured');
  }
  if (debug) {
    console.log('xenon-capture settings:', api.settings);
  }

  // Subscribe to all events (standard, dom, custom)
  api.analytics.subscribe('all_events', (event) => {
    if (debug) {
      console.log('xenon-capture event:', event);
      //console.log('xenon-capture init:', api.init);
    }
    switch(event.name) {
      case 'checkout_contact_info_submitted':
        const person = {
          email: event.data.checkout.email,
          name: [event.data.checkout.billingAddress.firstName, event.data.checkout.billingAddress.lastName].join(' ')
        };
        Xenon.deanonymize(person).then(() => {
          Xenon.heartbeat().then();
        });
        if (debug) {
          console.log('Xenon.deanonymize', person);
        }
        break;
      case 'checkout_shipping_info_submitted':
        Xenon.contentCreated('shipping');
        Xenon.heartbeat().then();
        if (debug) {
          console.log('Xenon.contentCreated shipping');
        }
        break;
      case 'payment_info_submitted':
        Xenon.contentCreated('billing');
        Xenon.heartbeat().then();
        if (debug) {
          console.log('Xenon.contentCreated billing');
        }
        break;
      case 'checkout_completed':
        // Payment flow (basic or express)
        Xenon.milestone('Selection','Payment', 'Flow', paymentFlow);
        Xenon.heartbeat().then();
        if (debug) {
          console.log('Xenon.milestone selectionPaymentFlow', paymentFlow);
        }
        // Payment method (there can be multiple transactions)
        event.data.checkout.transactions.map((transaction) => {
          Xenon.milestone('Selection', 'Payment', 'Used',transaction.gateway)
          if (debug) {
            console.log('Xenon.milestone selectionPaymentUsed', transaction.gateway);
          }
        });
        Xenon.heartbeat().then();

        // Purchase details
        const skus = event.data.checkout.lineItems.map(item => item.id);
        const total = event.data.checkout.totalPrice.amount;
        Xenon.purchase(skus, total);
        Xenon.heartbeat().then();
        if (debug) {
          console.log('Xenon.purchase', skus, total);
        }
        break;
      case 'clicked':
        // Set variable for pay now button pushed
        if (event.data.element.id === 'summary_pay_button') {
          api.browser.sessionStorage.setItem('xenon-paymentFlow', 'payment_basic');
          if (debug) {
            console.log('xenon-capture paymentFlow = payment_basic');
          }
        }
        break;
      case 'xenon':
        Xenon.pageLoadTime(event.customData.loadTime.toString(), event.customData.href);
        Xenon.heartbeat();
        if (debug) {
          console.log('Xenon.pageLoadTime:', event.customData);
        }
        break;
      default:
        //optional log message
    }
  });
});
