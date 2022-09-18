const { ObjectId } = require("bson");

module.exports = function (db) {
  var module = {};

  module.findByCodes = async function (req, res) {
    var tbl = req.params.db;
    if (tbl === '_') tbl = 'data';
    else if (["genekeys", "humandesign", "daily"]) {
      tbl = 'data_' + tbl;
    } else {
      return res.status(403).send({
        success: false,
        message: 'tbl wrong format'
      })
    }

    codes = req.body.codes;
    if (codes == null || codes.length === 0) {
      return res.send({
        status: 'error',
        data: 'codes cannot be empty'
      });
    }
    isFull = req.body.full;
    const loggedUser = req.user;
    // console.log(req.user);
    // console.log('codes', codes)
    console.log('tbl', tbl)

    const DataCollection = db.collection(tbl);
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

    var aggregateAr = [{
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
        from: tbl + "_translate",
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
        from: "data_ratings",
        let: { "did": "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$did", "$$did"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              rate: 1,
              uid: 1,
              content: 1
            }
          }
        ],
        as: "ratings",
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
      $addFields: {
        ratingAvg: {
          $divide: [
            { // expression returns total
              $reduce: {
                input: "$ratings",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.rate"] }
              }
            },
            { // expression returns ratings count
              $cond: [
                { $ne: [{ $size: "$ratings" }, 0] },
                { $size: "$ratings" },
                1
              ]
            }
          ]
        },
        totalRates: { $size: "$ratings" },
        myRates: {
          $filter: {
            input: "$ratings",
            as: "item",
            cond: { $eq: ["$$item.uid", ObjectId(loggedUser.id)] }
          }
        },
        // didIRate: { $size: "$myRates" },
      }
    }, {
      $project:
      {
        _id: 1,
        code: 1,
        content: 1,
        lang: 1,
        sid: 1,
        source: 1,
        trans: 1,
        ratings: 1,
        ratingAvg: 1,
        totalRates: 1,
        myRates: 1,
        didIRate: { $size: "$myRates" },
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
                    $or: [{
                      $gt: [point, 0]
                    }, {
                      $gt: [isPremium, 0]
                    }]
                  }, {
                    $eq: [isFull, 1]
                  }]
                }]
              }, {
                $gt: [{ "$strLenCP": "$content" }, 400]
              }]
            }, then: "$content",
            else: {
              $substrCP: ["$content", 0, 300]
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
                    $or: [{
                      $gt: [point, 0]
                    }, {
                      $gt: [isPremium, 0]
                    }]
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
      $sort: {
        "source.priority": 1,
      }
    }, {
      $group: {
        _id: "$code",
        // total: { $sum: 1 }
        data: { $push: "$$ROOT" }
      }
    }]
    // console.log('aggregateAr', JSON.stringify(aggregateAr));

    var items = await DataCollection.aggregate(aggregateAr).toArray();

    console.log('items', JSON.stringify(items))

    var ret_ar = {}
    if (items != null && items.length > 0) {
      // var subPoint = false;

      await Promise.all(items.map(async function (item) {
        var item_data = item.data;
        // console.log('item_data', item_data)

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
  };



  module.translateData = async function (req, res) {
    var tbl = req.params.db;
    if (tbl === '_') tbl = 'data';
    else if (["genekeys", "humandesign", "daily"]) {
      tbl = 'data_' + tbl;
    } else {
      return res.status(403).send({
        success: false,
        message: 'tbl wrong format'
      })
    }

    var trans_data = req.body;

    var dt = dateTime.create();
    trans_data.created_time = trans_data.updated_time = dt.format('Y-m-d H:M:S');
    console.log('[/user/data][translateData] Adding post: ' + JSON.stringify(trans_data));

    const loggedUser = req.user;
    trans_data.uid = ObjectId(loggedUser.id);

    const DataTransCollection = db.collection(tbl + "_translate");
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
  };


  module.rateData = async function (req, res) {
    var tbl = req.params.db;
    if (tbl === '_') tbl = 'data';
    else if (["genekeys", "humandesign", "daily"]) {
      tbl = 'data_' + tbl;
    } else {
      return res.status(403).send({
        success: false,
        message: 'tbl wrong format'
      })
    }

    if (reviews_data.did == null || reviews_data.did.length === 0) {
      return res.status(403).send({
        success: false,
        message: 'missing fields'
      })
    }

    var reviews_data = req.body;

    var dt = dateTime.create();
    reviews_data.created_time = reviews_data.updated_time = new Date(dt.format('Y-m-d H:M:S'));
    console.log('[/user/data][rateData] Adding post: ' + JSON.stringify(reviews_data));

    const loggedUser = req.user;
    reviews_data.uid = ObjectId(loggedUser.id);
    reviews_data.did = ObjectId(reviews_data.did);
    reviews_data.tbl = tbl;

    const DataRatingsCollection = db.collection('data_ratings');
    try {
      const result = await DataRatingsCollection.insertOne(reviews_data, { safe: true })
      reviews_data._id = result.insertedId;
      // console.log('Success: ' + JSON.stringify(result));
      return res.send({
        status: 'success',
        data: reviews_data
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  };


  module.getRates = async function (req, res) {
    var tbl = req.params.db;
    if (tbl === '_') tbl = 'data';
    else if (["genekeys", "humandesign", "daily"]) {
      tbl = 'data_' + tbl;
    } else {
      return res.status(403).send({
        success: false,
        message: 'tbl wrong format'
      })
    }

    var did = req.body.did;
    if (did == null || did.length === 0) {
      return res.status(403).send({
        success: false,
        message: 'missing fields'
      })
    }
    did = ObjectId(did);

    var aggregateAr = [{
      $match: {
        $and: [{
          did: { $eq: did }
        }, {
          tbl: { $eq: tbl },
        }]
      }
    }, {
      $lookup: {
        from: "users",
        let: { "uid": "$uid" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$uid"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              avatar: 1,
              username: 1,
              first_name: 1,
              last_name: 1
            }
          }
        ],
        as: "uinfo",
      }
    }, {
      $unwind:
      {
        path: "$uinfo",
        preserveNullAndEmptyArrays: true
      }
    }]

    console.log('getRates', JSON.stringify(aggregateAr));

    const DataRatingsCollection = db.collection('data_ratings');
    try {
      const items = await DataRatingsCollection.aggregate(aggregateAr).toArray();
      // console.log('Success: ' + JSON.stringify(result));
      return res.send({
        status: 'success',
        data: items
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  };


  return module;
}
