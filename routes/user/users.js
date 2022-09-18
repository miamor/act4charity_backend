const { ObjectId } = require("bson");

module.exports = function (db) {
  var module = {};

  module.getAstrologers = async function (req, res) {
    const loggedUser = req.user;

    order_field = req.body.order;
    order_asc = req.body.asc;

    if (order_field == null) {
      order_field = 'stars'
    }
    if (order_asc == null) {
      order_asc = -1;
    }
    console.log('[/user/user/astrologers][getAstrologers] req.body', req.body);

    const UsersCollection = db.collection('users');

    var items = await UsersCollection.aggregate([{
      $match: {
        type: { $eq: 'astrologer' }
      }
    }, {
      $lookup:
      {
        from: "chat_topics",
        let: { "as_id": "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{
                  $eq: ["$with", "$$as_id"]
                }, {
                  $eq: ["$uid", ObjectId(loggedUser.id)]
                }, {
                  $ne: ["$status", "close"]
                }]
              }
            }
          },
          {
            $project: {
              _id: 1,
            }
          }
        ],
        as: "topics",
      }
    }, {
      $sort: {
        order_field: order_asc
      }
    }]).toArray();

    console.log('[/user/users/astrologers][getAstrologers] items', JSON.stringify(items));

    return res.send({
      status: 'success',
      data: items
    });
  };

  return module;
}
