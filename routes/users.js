module.exports = function (db) {
  var module = {};

  module.getAstrologers = async function (req, res) {
    order_field = req.body.order;
    order_asc = req.body.asc;

    if (order_field == null) {
      order_field = 'stars'
    }
    if (order_asc == null) {
      order_asc = -1;
    }
    // console.log('[/user/topics][getAstrologers] req.body', req.body);

    const UsersCollection = db.collection('users');

    var items = await UsersCollection.aggregate([{
      $match: {
        type: { $eq: 'astrologer' }
      }
    }, {
      $sort: {
        order_field: order_asc
      }
    }]).toArray();

    // console.log('[/users/astrologers][getAstrologers] items', items);

    return res.send({
      status: 'success',
      data: items
    });
  };

  return module;
}
