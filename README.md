# mailchimp-subscribe-form

Takes care of the logic to asynchronously submit a MailChimp subscribe form,
without any extra JS library.

## Usage

Include mailchimp-subscribe-form.js in your HTML, where
`<your-mailchimp-post-url>` is e.g.
`//<something>.us3.list-manage1.com/subscribe/post?u=<some-id>&id=<some-id>/`.
You can retrieve your own URL from the "Embedded forms" section for your
MailChimp account.

```html
<form class="js-subscribe-form" action="<your-mailchimp-post-url>">
  <fieldset>
    <input type="email" name="EMAIL" placeholder="Your email address">
    <button type="submit">Subscribe</button>
  </fieldset>
</form>

<!--
Note that you need to name your input fields according to what MailChimp
expects. For example:

<input name="EMAIL" placeholder="Email address">
<input name="FNAME" placeholder="First name">
<input name="LNAME" placeholder="Last name">

You can customize your fields on the "Embedded forms" section for your
MailChimp account.
-->

<script src="mailchimp-subscribe-form.js"></script>
```

Instantiate MailChimpSubscribeForm for each element:

```javascript
var elems = document.querySelectorAll('.js-subscribe-form');
for (var i = 0; i < elems.length; i++) {
  new MailChimpSubscribeForm(elems[i]);
}
```

You can also pass custom options as the second argument to
`MailChimpSubscribeForm`. These are the defaults:

```javascript
{
  url: this.formElem_.getAttribute('data-url') || this.formElem_.action,
  jsonpCallbackProperty: 'c',  // change this to whatever MailChimp expects
  successMessageElem: this.formElem_.parentNode.querySelector('.js-success-message'),
  errorMessageElem: this.formElem_.parentNode.querySelector('.js-error-message'),
  translateFunction: function(str) { return str; }  // pass your own translate function if you want translations
}
```

Pass your own options object to override.

## License
[MIT](http://eriklindebratt.mit-license.org/)
