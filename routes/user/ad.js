const { ObjectId } = require('mongodb'); // or ObjectID 

module.exports = function (db) {
  var module = {};

  module.finishedWatchingAd = async function (req, res) {
    const loggedUser = req.user;

    const UsersCollection = db.collection('users');

    var user = await UsersCollection.findOne({ _id: ObjectId(loggedUser.id) });
    const point = user.point + 5;

    try {
      await UsersCollection.updateOne({
        _id: ObjectId(loggedUser.id)
      }, {
        $set: {
          point: point
        }
      });

      return res.send({
        status: 'success',
        data: user,
        point: point
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: 'An error has occurred'
      });
    }
  }

  return module;
}
