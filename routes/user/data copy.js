module.exports = function (db) {
  var module = {};

  module.findById = function (req, res) {
    var id = req.params.id;
    console.log('Retrieving post: ' + id);
    db.collection('posts', function (err, collection) {
      collection.findOne({ _id: ObjectID(id) }, function (err, item) {
        console.log(item);
        return res.send(item);
      })
    });
  };

  module.findByCodes = async function (req, res) {
    codes = req.body.codes;
    isFull = req.body.full;
    const loggedUser = req.user;
    // console.log(req.user);
    // console.log('codes', codes)

    const DataCollection = db.collection('data');
    const UsersCollection = db.collection('users');

    // loggedUser info
    const loggedUserInfo = await UsersCollection.findOne({
      username: loggedUser.username
    })
    const point = loggedUserInfo.point;
    const isPremium = loggedUserInfo.premium;

    // var showFull = 0;
    // if (isFull) {
    // }
    console.log('point', point)

    var items = await DataCollection.aggregate([{
      $match: {
        $and: [{
          code: { $in: codes }
        }, {
          status: { $eq: 1 },
        }]
      }
    }, {
      $lookup:
      {
        from: "source",
        // localField: "sid",
        // foreignField: "_id",
        let: { "sid": "$sid" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$sid"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              title: 1,
              lang: 1,
              priority: 1
            }
          }
        ],
        as: "source",
      }
    }, {
      $project:
      {
        _id: 1,
        code: 1,
        content: 1,
        sid: 1,
        source: 1,
        status: 1,
        is_advanced: 1,
        content: {
          // $substrCP: [ "$content", 0, 400 ] 
          $cond: {
            if: {
              $or: [{
                $eq: ["$is_advanced", 0]
              }, {
                $and: [{
                  $eq: ["$is_advanced", 1]
                }, {
                  $gt: [point, 0]
                }, {
                  $eq: [isFull, 1]
                }]
              }]
            }, then: "$content",
            else: {
              $substrCP: ["$content", 0, 400]
            }
          }
        },
        is_content_trimmed: {
          $cond: {
            if: {
              $or: [{
                $eq: ["$is_advanced", 0]
              }, {
                $and: [{
                  $eq: ["$is_advanced", 1]
                }, {
                  $gt: [point, 0]
                }, {
                  $eq: [isFull, 1]
                }]
              }]
            }, then: 0,
            else: 1
          }
        }
        // content_substr: { $substr: ["$content", 0, 2] },
        // quarterSubtring: { $substr: ["$quarter", 2, -1] }
      }
    }, {
      $group: {
        _id: "$code",
        // total: { $sum: 1 }
        data: { $push: "$$ROOT" }
      }
    }]).toArray();
    // async function (err, items) {

    var ret_ar = {}
    if (items != null && items.length > 0) {
      var subPoint = false;

      await Promise.all(items.map(async function (item) {
        var item_data = item.data;
        console.log('item_data', item_data)

        if (point > 0 && item_data[0].is_advanced == 1 && item_data[0].is_content_trimmed == 0 && isPremium == 0) {
          try {
            await UsersCollection.updateOne({
              username: loggedUser.username
            }, {
              $set: {
                point: point - 1
              }
            });

            console.log('hey~~')

            ret_ar[item._id] = item_data
            console.log('  > ret_ar', ret_ar)
          }
          catch (error) {
            console.log('[/user/data][findByCodes] error', error)
          }
        }
      }))

      // console.log('ret_ar', ret_ar);
    }
    return res.send({
      status: 'success',
      data: ret_ar
    });
    // });
  };

  module.add = function (req, res) {
    var posts = req.body;

    var dt = dateTime.create();
    posts.created_time = posts.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Adding post: ' + JSON.stringify(posts));

    db.collection('posts', function (err, collection) {
      collection.insert(posts, { safe: true }, function (err, result) {
        if (err) {
          return res.send({ 'error': 'An error has occurred' });
        } else {
          console.log('Success: ' + JSON.stringify(result));
          console.log(result.ops);
          return res.send(result.ops[0]);
        }
      });
    });
  }

  module.update = function (req, res) {
    var id = req.params.id;
    var posts = req.body;
    //delete posts['_id'];

    var dt = dateTime.create();
    posts.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Updating posts: ' + id);
    console.log(JSON.stringify(posts));

    db.collection('posts', function (err, collection) {
      collection.update({ _id: ObjectID(id) }, posts, { safe: true }, function (err, result) {
        if (err) {
          console.log('Error updating posts: ' + err);
          return res.send({ 'error': 'An error has occurred' });
        } else {
          console.log('' + result + ' document(s) updated');
          return res.send(posts);
        }
      });
    });
  }

  module.delete = function (req, res) {
    var id = req.params.id;
    console.log('Deleting posts: ' + id);
    db.collection('posts', function (err, collection) {
      collection.remove({ _id: ObjectID(id) }, { safe: true }, function (err, result) {
        if (err) {
          return res.send({ 'error': 'An error has occurred - ' + err });
        } else {
          console.log('' + result + ' document(s) deleted');
          return res.send(req.body);
        }
      });
    });
  }

  return module;
}
