# passport-http-custom-bearer

[![NPM version](https://img.shields.io/npm/v/passport-http-custom-bearer.svg)](https://www.npmjs.org/package/passport-http-custom-bearer) [![Dependency Status](https://david-dm.org/wwwslinger/passport-http-custom-bearer.png)](https://david-dm.org/wwwslinger/passport-http-custom-bearer)  ![MIT License](http://img.shields.io/badge/license-MIT-green.svg)


HTTP Bearer authentication strategy for [Passport](http://passportjs.org/) using a custom header field.

This module lets you authenticate HTTP requests using bearer tokens, as
specified by [RFC 6750](http://tools.ietf.org/html/rfc6750), in your Node.js
applications, using either the recommended ``Authorization`` header name or
a custom name.  Bearer tokens are typically used protect API endpoints, and are
often issued using OAuth 2.0.

By plugging into Passport, bearer token support can be easily and unobtrusively
integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-http-custom-bearer

## Usage

#### Configure Strategy

The HTTP Bearer authentication strategy authenticates users using a bearer
token.  The strategy requires a `verify` callback, which accepts that
credential and calls `done` providing a user.  Optional `info` can be passed,
typically including associated scope, which will be set by Passport at
`req.authInfo` to be used by later middleware for authorization and access
control.

For example, to authenticate using a custom header ``X-APIAuth``, or a custom
body field ``api_token``, or a custom query parameter ``api_token``:

    var CustomBearerStrategy = require('passport-http-custom-bearer');
    passport.use('api-bearer', new CustomBearerStrategy(
      { headerName: 'APIAuth',
        bodyName: 'api_token',
        queryName: 'api_token'
      },
      function(token, done) {
        User.findOne({ token: token }, function (err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          return done(null, user, { scope: 'all' });
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'bearer'` strategy (or your named strategy), to
authenticate requests.  Requests containing bearer tokens do not require session
support, so the `session` option can be set to `false`.

For example, as route middleware in an [Express](http://expressjs.com/)
application for the above example strategy:

    app.get('/profile', 
      passport.authenticate('api-bearer', { session: false }),
        function(req, res) {
          res.json(req.user);
      });

As a [policy](http://sailsjs.org/documentation/concepts/policies) in [Sails](http://sailsjs.org/), 
using the above example strategy:

    var passport = require('passport');

    module.exports = function(req, res, next) {

      passport.authenticate(
        'api-bearer',
        function(err, user, info)
        {
          console.log("Authentication via API Bearer", info);
          if ((err) || (!user)) {
            res.send(401);
            return;
          }
          if (info && info.queryName && info.queryName.length) delete req.query[info.queryName];
          else delete req.query.access_token;
          req.user = user;
          return next();
        }
      )(req, res);
    };

#### Issuing Tokens

Bearer tokens are typically issued using OAuth 2.0.  [OAuth2orize](https://github.com/jaredhanson/oauth2orize)
is a toolkit for implementing OAuth 2.0 servers and issuing bearer tokens.  Once
issued, this module can be used to authenticate tokens as described above.

## Examples

For a complete, working example using the defaults, refer to the [Bearer example](https://github.com/passport/express-4.x-http-bearer-example).

## Related Modules

- [OAuth2orize](https://github.com/jaredhanson/oauth2orize) — OAuth 2.0 authorization server toolkit

## Tests

    $ npm install
    $ npm test

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)
  - [Jason McInerney](http://github.com/wwwslinger)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2011-2013 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>
