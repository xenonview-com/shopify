# view-shopify
Xenon View Instrumentation for Shopify in an extension-only app

### Prerequisites

Before you begin, you'll need the following:

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.


Update the `shopify.app.toml` file, configuring the follwing lines with your dev store url and client id.
```
client_id = "YOUR_CLIENT_ID"
dev_store_url = "YOUR_STORE_DOMAIN.myshopify.com"
```

**Note**: If you don't make the above update, the deployment process will ask you to do a reset, making a copy of `shopify.app.toml` to update the client id.  However, the copy action messes up the scopes.


### Setup

Add the following to the theme.liquid file, right near the end of the </head> section
```
    <!-- begin Xenon capture -->
    <script>
      const formInfo = (t) => {
        const f = t.closest('form');
        return f ? f.hasAttribute('id') ? f.getAttribute('id') : f.getAttribute('data-testid') : null;
      }
      const linkEvent = (e) => {
        const a = e.target.closest('a');
        const t = a.innerText ? a.innerText.split('\n')[0].trim() : null;
        const id = a.hasAttribute('id') ? a.getAttribute('id') : a.hasAttribute('class') ? a.getAttribute('class').split(' ')[0] : null;
        Shopify.analytics.publish('xenon_link', {id: id ? id : cl ? cl.split(' ')[0] : null, text: t, href: a.getAttribute('href')});
        setTimeout(() => document.querySelectorAll('a').forEach((a) => a.addEventListener('click', linkEvent)), 1000);
      }
      const inputEvent = (e) => {
        const t = e.target.labels ? Array.from(e.target.labels, (l) => l.innerText.trim()).join(' ') : null;
        const id = e.target.hasAttribute('name') ? e.target.getAttribute('name') : e.target.hasAttribute('id') ? e.target.getAttribute('id') : formInfo(e.target);
        const cl = e.target.getAttribute('class');
        const type = e.target.hasAttribute('type') ? e.target.getAttribute('type') : e.target.nodeName.toLowerCase();
        Shopify.analytics.publish('xenon_input', {id: id, class: cl ? cl.split(' ')[0] : null, text: t, type});
        setTimeout(() => document.querySelectorAll('input,textarea').forEach((i) => i.addEventListener('click', inputEvent)), 1000);
      }
      const buttonEvent = (e) => {
        const b = e.target.closest('button');
        const t = b.innerText ? b.innerText.split('\n')[0].trim() : null;
        const id = b.hasAttribute('aria-label') ? b.getAttribute('aria-label') : b.hasAttribute('name') ? b.getAttribute('name') : b.hasAttribute('id') ? b.getAttribute('id') : formInfo(e.target);
        const cl = b.getAttribute('class');
        Shopify.analytics.publish('xenon_button', {id: id, class: cl ? cl.split(' ')[0] : null, text: t, type: b.getAttribute('type')});
        setTimeout(() => document.querySelectorAll('button').forEach((b) => b.addEventListener('click', buttonEvent)), 1000);
      }
      const divEvent = (e) => {
        const b = e.target.closest('[role="button"]');
        const t = b.innerText ? b.innerText.split('\n')[0].trim() : null;
        const id = b.hasAttribute('aria-label') ? b.getAttribute('aria-label') : b.hasAttribute('id') ? b.getAttribute('id') : b.hasAttribute('data-testid') ? b.getAttribute('data-testid') : formInfo(e.target);
        const cl = b.getAttribute('class');
        Shopify.analytics.publish('xenon_button', {id: id, class: cl ? cl.split(' ')[0] : null, text: t, type: 'role'});
        setTimeout(() => document.querySelectorAll('[role="button"]').forEach((d) => {if (!['A','BUTTON','INPUT'].includes(d.nodeName)) d.addEventListener('click', divEvent)}), 1000);
      }
      const pageLoadTime = () => {
        const duration = performance.getEntriesByType('navigation')[0].duration;
        const platform = navigator.platform ? navigator.platform : navigator.userAgentData ? navigator.userAgentData.platform : 'unknown';
        if (!duration) setTimeout(pageLoadTime, 0);
        else {
          Shopify.analytics.publish('xenon_timing', {loadTime: duration/1000, href: window.location.href, platform});
          document.querySelectorAll('a').forEach((a) => a.addEventListener('click', linkEvent));
          document.querySelectorAll('input,textarea').forEach((i) => i.addEventListener('click', inputEvent));
          document.querySelectorAll('button').forEach((b) => b.addEventListener('click', buttonEvent));
          document.querySelectorAll('[role="button"]').forEach((d) => {if (!['A','BUTTON','INPUT'].includes(d.nodeName)) d.addEventListener('click', divEvent)});
        }
      }
      document.addEventListener('DOMContentLoaded', pageLoadTime);
    </script>
    <!-- end Xenon capture -->
```

The extension-only Shopify app is called xenon-view.  It has an extension called xenon-capture.

Using npm:

```shell
npm install
```

If you updated the version of the app from Git, you need to deploy that update

```shell
npm run deploy
```

This step should generate the `.env` file containing your API credentials as follows:
```
SHOPIFY_API_KEY=YOUR_KEY
SHOPIFY_API_SECRET=YOUR_SECRET
```

### Local Development

```shell
npm run dev
```

Press P to open the URL to your app. Once you click install, you can start development.

Local development is powered by [the Shopify CLI](https://shopify.dev/docs/apps/tools/cli). It logs into your partners account, connects to an app, provides environment variables, updates remote config, creates a tunnel and provides commands to generate extensions.

### Configure the xenon-capture extension

In order for the extension to access the store, you need to run a GraphQl command to activate it.
This same command also configures its settings.

| Setting      | Value        | Description                 |
|--------------|--------------|-----------------------------|
| apiKey       | YOUR_API_KEY | Used to call Xenon.Init()   |
| debug        | true / false | Enable debug logging        |
| purchaseOnly | true / false | Only report purchase events |

Go to http://localhost:3457/graphiql and run the following:

```
mutation {
  # Creates a web pixel, and sets the Xenon `apiKey` for this shop
  webPixelCreate(webPixel: { settings: "{\"apiKey\":\"YOUR_API_KEY_HERE\", \"debug\":\"true\", \"purchaseOnly\":\"false\"}" }) {
    userErrors {
      code
      field
      message
    }
    webPixel {
      settings
      id
    }
  }
}
```

You will then see each event logged to the browser console on your development store.

## Resources

- [Introduction to Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [App authentication](https://shopify.dev/docs/apps/auth)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [App extensions](https://shopify.dev/docs/apps/app-extensions/list)
- [Shopify Functions](https://shopify.dev/docs/api/functions)
