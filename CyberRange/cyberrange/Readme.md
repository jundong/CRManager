# Axon


## Relevant files/directories

* **components/** - third-party components (dependencies)
* **components-spirent/** - Spirent components (stuff I wrote);
* **components-spirent/boot** - JS bootstrap; included by templates/index.jinja2 (see below)
* **static/js/build.*** - Assets compiled from running `make` from the command line
* **Makefile** - GNU Makefile used to compile build.js and build.css; run `make targets` to get a list of possible make targets
* **component.json** - root-level component definition; specifies an include path and modules to include when building (the “local” attribute, “boot”, which means start compiling from components-spirent/boot)
* **static/js/test.html** - Mocha test runner; open this in your browser (with file:// or https://) to see the status of unit tests; add new test suites to this file
* **static/js/tests/** - tests copied over from component test directories (don’t edit these)
* **templates/index.jinja2** - Main HTML index template; where the boot component is inserted into the web page.


## Installing
1. [Install node & npm](http://nodejs.org/): `brew install node` or similar
2. Install component.io 1.0+: `npm install -g component`
3. Install node dependencies (in same directory as this README): `npm install`
4. [Setup a ~/.netrc](https://github.com/componentjs/guide/blob/master/changelogs/1.0.0.md#required-authentication) for api.github.com using a [personal access token](https://github.com/settings/applications#personal-access-tokens):
```
machine api.github.com
    login <token>
    password x-oauth-basic
```


## Building

* Type `make targets` to get a list.
* Type `make dev` to build only development code - be sure you use `?debug` when you load the URL in your browser
* Type `make` to build everything
* Type `make all` to install dependencies, convert HTML to JS, and build


## Testing
1. Type `make test` to copy unit tests to static/js/test/
2. Open `static/js/test.html` in your browser


## Creating a module
1. `component create components-spirent/<module name>` (lowercase with hypens)
2. Include your component by explicitly listing it as a "local" dependency in another component: update this other
components `component.json` (see components-spirent/boot/component.json for an example)
3. Build (see above)


## Adding a test
1. `mkdir components-spirent/<module name>/test`
2. Add a test suite as `components-spirent/<component>/test/*.js` (see existing tests for examples)
3. `make test`
4. Add the test (copied to static/js/test/ in previous command) to `static/js/test.html`


## Testing a module
1. `make test`
2. Open `static/js/test.html` in your browser
3. Look for your tests