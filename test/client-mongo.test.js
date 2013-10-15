var Clients = require('..').Clients;

var clients = Clients();

clients.create({name: 'pivot-ui'}, function(err, id) {
  clients.get(id, function(err, client) {
    console.log(arguments);
  });
});
