# KeePassHttp-Connector

is an extension to integrate [KeePass](http://keepass.info)/[KeePassXC](https://keepassxc.org/) as a password manager with Mozilla Firefox and Google Chrome browsers.

They require [KeePassHttp](https://github.com/pfn/keepasshttp/), a KeePass plugin to expose password entries securely (256bit AES/CBC) over HTTP.

It was forked from [chromeIPass/passIFox](https://github.com/pfn/passifox), with support for newer versions of Firefox (42+).

## Deprecation Notice

This extension will no longer be maintained since KeePassXC 2.3.0 now includes support for the [keepassxc-browser](https://github.com/keepassxreboot/keepassxc-browser) extension, and will be removing KeePassHTTP support in a future release.

For KeePass, you can use my [KeePassNatMsg](https://github.com/smorks/keepassnatmsg) plugin, which also works with the keepassxc-browser extension.

## Downloads

- Mozilla Firefox - [Add-on](https://addons.mozilla.org/en-US/firefox/addon/keepasshttp-connector/)
- Google Chrome - [Extension](https://chrome.google.com/webstore/detail/keepasshttp-connector/dafgdjggglmmknipkhngniifhplpcldb)

## Documentation

- [Documentation](https://github.com/smorks/keepasshttp-connector/blob/master/documentation/KeePassHttp-Connector.md) (features, installation guide, troubleshooting, functionality, etc.)

Support is always welcome.

## Troubleshooting

If you [open an issue](https://github.com/smorks/keepasshttp-connector/issues/), always give us the following information:

1. the extension are you using and its version
2. version of your browser
3. KeePassHttp version
4. KeePass/KeePassXC version
5. pages on which the error occur
