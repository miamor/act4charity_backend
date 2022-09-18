module.exports = function(db) {
  var module = {};

  module.getList = function(req, res) {
    console.log(req.user.username);
    db.collection('messages', function(err, collection) {
      /*collection.find({
        to: req.user.username
      }).toArray(function(err, items) {
        if (!err) {
          console.log(items);
          return res.send(items);
        } else return [];
      });*/

      collection.aggregate([{
        $match: {
          to: req.user.username
        }
      }, {
        $group: {
          _id: "$to",
          total: { $sum: 1 }
        }
      }]).toArray(function(err, items) {
        console.log(items);
        return res.send(items);
      });
    });
  };

  return module;
}