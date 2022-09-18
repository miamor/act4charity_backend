module.exports = function (db) {
  var module = {};

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
        from: "data_translate",
        let: { "orig_id": "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$orig_id", "$$orig_id"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              lang: 1,
              content: 1,
              orig_id: 1,
              code: 1,
              sid: 1,
              is_advanced: 1
            }
          }
        ],
        as: "trans",
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
      $unwind:
      {
        path: "$source",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $project:
      {
        _id: 1,
        code: 1,
        content: 1,
        sid: 1,
        source: 1,
        trans: 1,
        content: {
          // $substrCP: [ "$content", 0, 400 ] 
          $cond: {
            if: {
              $and: [{
                $eq: [codes.length, 1]
              }, {
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
              $and: [{
                $eq: [codes.length, 1]
              }, {
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
              }]
            }, then: 0,
            else: 1
          }
        },
        is_advanced: 1,
        status: 1,
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
      // var subPoint = false;

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

            // console.log('hey~~')

            // console.log('  > ret_ar', ret_ar)
          }
          catch (error) {
            console.log('[/user/data][findByCodes] error', error)
          }
        }

        ret_ar[item._id] = item_data
      }))

      // console.log('ret_ar', ret_ar);
    }
    return res.send({
      status: 'success',
      // data: codes.length == 1 ? ret_ar[0] : ret_ar
      data: ret_ar
    });
    // });
  };



  module.translateData = async function (req, res) {
    var trans_data = req.body;

    var dt = dateTime.create();
    trans_data.created_time = trans_data.updated_time = dt.format('Y-m-d H:M:S');
    console.log('[/user/data][translateData] Adding post: ' + JSON.stringify(trans_data));

    const loggedUser = req.user;
    trans_data.uid = ObjectId(loggedUser.id);

    const DataTransCollection = db.collection('data_translate');
    try {
      const result = await DataTransCollection.insertOne(trans_data, { safe: true })
      // console.log('Success: ' + JSON.stringify(result));
      return res.send({
        status: 'success',
        data: trans_data
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }


  return module;
}
