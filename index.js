/**
 * Module dependencies
 */

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var crypto = require('crypto');
var randomBytes = crypto.randomBytes;
var hash = crypto.createHash;

module.exports = function(options) {
  var clients = Clients(options);
  return function(app) {
    app.client(function(req, id, done) {
      clients.get(req.get('x-env'), id, done);
    });
  };
};

module.exports.Clients = Clients;

function Clients(url) {
  if (!(this instanceof Clients)) return new Clients(url);
  this.url = url || 'mongodb://127.0.0.1:27017';
}

Clients.prototype.get = function(env, id, done) {
  if (typeof id === 'function') {
    done = id;
    id = env;
    env = null;
  }

  this.collection(env, function(err, collection) {
    if (err) return done(err);

    collection.findOne({_id: id}, function(err, client) {
      if (err) return done(err);
      delete client._id;
      done(null, client);
    });
  });
};

Clients.prototype.create = function(env, params, done) {
  if (typeof params === 'function') {
    done = params;
    params = env;
    env = null;
  }

  var self = this;

  function save() {
    self.collection(env, function(err, collection) {
      if (err) return done(err);

      collection.insert(params, function(err, doc) {
        if (err) return done(err);
        done(null, doc[0]._id);
      });
    });
  }

  // TODO verify params
  // * scopes
  // * redirect_uri
  // * others?

  if (params.secret) return save();

  createSecret(function(err, secret) {
    if (err) return done(err);
    params.secret = secret;
    save();
  });
};

Clients.prototype.collection = function(env, cb) {
  this.connect(function(err, db) {
    if (err) return cb(err);
    cb(null, db.collection('client:' + (env || 'production')));
  });
};

Clients.prototype.connect = function(cb) {
  if (this.db) return cb(null, this.db);
  MongoClient.connect(this.url, function(err, db) {
    if (err) return cb(err);
    this.db = db;
    cb(null, db);
  });
};

function createSecret(cb) {
  randomBytes(4096, function(err, buf) {
    if (err) return cb(err);
    var shasum = hash('sha256');
    shasum.update(buf);
    cb(null, shasum.digest('hex'));
  });
}