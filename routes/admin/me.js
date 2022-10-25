module.exports = function (db) {
  var module = {};

  module.getMyInfo = function (req, res) {
    var token = req.headers['Authorization'] || req.headers['authorization'];

    if (token) {
      // verifies secret and checks exp
      jwt.verify(token, app.get('superSecret'), function (err, decoded) {
        if (err) {
          return res.send({ success: false, message: 'Failed to authenticate token.' });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          console.log(decoded);
          // get user info here
          db.collection('users', function (err, collection) {
            collection.findOne({ username: decoded.username }, function (err, item) {
              delete item['_id'];
              delete item['password'];
              console.log('Got my info: ');
              console.log(JSON.stringify(item));
              return res.send(item);
            });
          });
        }
      });
    } else {

      // if there is no token
      // return an error
      return res.status(403).send({
        success: false,
        status: 'error',
        message: 'No token provided.'
      });

    }
  };

  module.update = function (req, res) {
    var users = req.body;
    //delete users['_id'];
    users.username = req.user.username;
    users.type = req.user.type;

    var dt = dateTime.create();
    users.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Updating my info: ');
    console.log(JSON.stringify(users));

    db.collection('users', function (err, collection) {
      collection.update({ _id: req.user.id }, users, { safe: true }, function (err, result) {
        if (err) {
          console.log('Error updating users: ' + err);
          return res.status(505).send({ 'error': 'An error has occurred' });
        } else {
          console.log('' + result + ' document(s) updated');
          return res.send({
            status: 'success',
            data: users
          });
        }
      });
    });
  }

  return module;
}
