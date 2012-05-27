JS.Class - Ruby-style JavaScript
===

http://jsclass.jcoglan.com

JS.Class is a JavaScript library for building object-oriented programs using
Ruby idioms. It implements Ruby's core object/module/class system in JavaScript,
as well as several standard Ruby libraries and various other extensions.


Development
---

To hack on JS.Class you'll need to be able to build it and run the tests. You
need Ruby and Jake to do this:

    gem install jake
    cd path/to/js.class
    jake

This will build the project and create files in the `build` directory. To run
the tests:

* Run `test/console.js` with a command-line interpreter
* Open `test/browser.html` in a web browser
* For XULRunner run `xulrunner -app test/xulenv/application.ini`
* For AIR run `adl test/airenv/app.xml`

Some interpreters will skip the tests that use asynchronous APIs, but the tests
should work using all the platforms listed in `site/src/pages/platforms.haml`.


License
---

Distributed under the MIT license.
Copyright (c) 2007-2012 James Coglan

