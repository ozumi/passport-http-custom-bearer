/**
 * Module dependencies.
 */
var passport = require('passport-strategy')
  , util = require('util');


/**
 * Creates an instance of `Strategy`.
 *
 * The HTTP Bearer authentication strategy authenticates requests based on
 * a bearer token contained in the custom-named header field given by the
 * `headerName` option (defaults to `Authorization` and ensures the `X-` prefix
 * otherwise), custom-named body parameter given by the `bodyName` option
 * (defaults to `access_token`), or a custom-named query parameter given by the
 * `queryName` option (defaults to `access_token`).
 *
 * NOTE:  All field names are converted to lower case.
 *
 * Applications must supply a `verify` callback, for which the function
 * signature is:
 *
 *     function(token, done) { ... }
 *
 * `token` is the bearer token provided as a credential.  The verify callback
 * is responsible for finding the user who posesses the token, and invoking
 * `done` with the following arguments:
 *
 *     done(err, user, info);
 *
 * If the token is not valid, `user` should be set to `false` to indicate an
 * authentication failure.  Additional token `info` can optionally be passed as
 * a third argument, which will be set by Passport at `req.authInfo`, where it
 * can be used by later middleware for access control.  This is typically used
 * to pass any scope associated with the token.
 *
 * Options:
 *
 *   - `realm`      authentication realm, defaults to "Users"
 *   - `scope`      list of scope values indicating the required scope of the access
 *                  token for accessing the requested resource
 *   - `headerName` header name to look for the Bearer authorization token, defaults
 *                  to "Authentication"
 *   - `bodyName`   body field name to look for the Bearer authorization token, defaults
 *                  to "access_token"
 *   - `queryName`  query parameter name to look for the Bearer authorization token,
 *                  defaults to "access_token"
 *
 * Examples:
 *
 *     passport.use(new BearerStrategy(
 *       { 'APIAuth', 'api_token', 'api_token'},
 *       function(token, done) {
 *         User.findByToken({ token: token }, function (err, user) {
 *           if (err) { return done(err); }
 *           if (!user) { return done(null, false); }
 *           return done(null, user, { scope: 'read' });
 *         });
 *       }
 *     ));
 *
 * For further details on HTTP Bearer authentication, refer to [The OAuth 2.0 Authorization Protocol: Bearer Tokens](http://tools.ietf.org/html/draft-ietf-oauth-v2-bearer)
 *
 * @constructor
 * @param {Object} [options]
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  function getCustomHeaders(options, which) {
    if (options) {
      if (options[which]) {
        var f = options[which].replace(/^X\-/i, '').toLowerCase();
        if (which == 'headerName') return 'x-' + f;
        return f;
      }
    }
  }
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify) { throw new TypeError('HTTPBearerStrategy requires a verify callback'); }

  passport.Strategy.call(this);
  this.name = 'custom-bearer';
  this._verify = verify;
  this._realm = options.realm || 'Users';
  if (options.scope) {
    this._scope = (Array.isArray(options.scope)) ? options.scope : [ options.scope ];
  }
  // custom fields
  this._headerName = getCustomHeaders(options, 'headerName') || 'authorization';
  this._bodyName = getCustomHeaders(options, 'bodyName') || 'access_token';
  this._queryName = getCustomHeaders(options, 'queryName') || 'access_token';

  this._passReqToCallback = options.passReqToCallback;
}


/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a HTTP Bearer authorization
 * header, body parameter, or query parameter.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req) {
  var token;

  if (req.headers && req.headers[this._headerName]) {
    var parts = req.headers[this._headerName].split(' ');
    if (parts.length == 2) {
      var scheme = parts[0]
        , credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    } else {
      return this.fail(400);
    }
  }

  if (req.body && req.body[this._bodyName]) {
    if (token) { return this.fail(400); }
    token = req.body[this._bodyName];
  }

  if (req.query && req.query[this._queryName]) {
    if (token) { return this.fail(400); }
    token = req.query[this._queryName];
  }

  if (!token) { return this.fail(this._challenge()); }

  var self = this;

  function verified(err, user, info) {
    info = info || {};
    if (err) { return self.error(err); }
    if (!user) {
      if (typeof info == 'string') {
        info = { message: info };
      }
      return self.fail(self._challenge('invalid_token', info.message));
    }
    info['headerName'] = self._headerName;
    info['bodyName'] = self._bodyName;
    info['queryName'] = self._queryName;

    self.success(user, info);
  }

  if (self._passReqToCallback) {
    this._verify(req, token, verified);
  } else {
    this._verify(token, verified);
  }
};

/**
 * Build authentication challenge.
 *
 * @api private
 */
Strategy.prototype._challenge = function(code, desc, uri) {
  var challenge = 'Bearer realm="' + this._realm + '"';
  if (this._scope) {
    challenge += ', scope="' + this._scope.join(' ') + '"';
  }
  if (code) {
    challenge += ', error="' + code + '"';
  }
  if (desc && desc.length) {
    challenge += ', error_description="' + desc + '"';
  }
  if (uri && uri.length) {
    challenge += ', error_uri="' + uri + '"';
  }

  return challenge;
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
