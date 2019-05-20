## DEPRECATED: electron-compilers

[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)

This project is no longer maintained, pull requests are no longer being reviewed or merged and issues are no longer being responded to. 

---

[![](https://electron-userland.github.io/electron-compilers/docs/badge.svg)](https://electron-userland.github.io/electron-compilers/docs)

electron-compilers are the actual implementations of classes that power
[electron-compile](https://github.com/electron-userland/electron-compile)

For JavaScript:

* JavaScript ES6/ES7 (via Babel)
* TypeScript
* CoffeeScript
* GraphQL

For CSS:

* LESS
* Stylus (with optional nib)

For HTML:

* Jade
* EJS

For JSON:

* CSON

### Why is this a separate repo?!

Shipping compilers for all of these languages will add a ton of weight to your
download size. Making this a separate top-level module allows you to mark it
as a `devDependency` and not include it in the final app.
