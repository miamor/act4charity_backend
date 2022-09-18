module.exports = function (db) {
  var module = {};

  module.findKeyEvents = async function (req, res) {
    day = req.body.day;
    const DataCollection = db.collection('data_key_events');
    console.log('day', day)
    var items = await DataCollection.aggregate([{
      $match: {
        $and: [{
          day: { $eq: day }
        }]
      }
    }]).toArray();
    return res.send({
      status: 'success',
      data: items
    });
  };


  module.findDaily = async function (req, res) {
    day_s = req.body.day_s
    day_e = req.body.day_e
    sign = req.body.sign

    if (day_s == null || day_s.length == 0 || day_e == null || day_e.length == 0 || sign == null || sign.length == 0) {
      return res.status(403).send({
        success: false,
        message: 'missing fields'
      })
    }

    const day = day_s + '_to_' + day_e
    console.log('day_s', day_s)
    console.log('day_e', day_e)
    console.log('sign', sign)

    const DataCollection = db.collection('data_daily');

    var items = await DataCollection.aggregate([{
      $match: {
        $and: [{
          day: { $eq: day }
        }, {
          sign: { $eq: sign }
        }]
      }
    }]).toArray();

    console.log(items);
    return res.send(items);
  };


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

    // console.log(req.user);
    // console.log('codes', codes)
    console.log('tbl', tbl)

    const DataCollection = db.collection(tbl);

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
        // myRates: {
        //   $filter: {
        //     input: "$ratings",
        //     as: "item",
        //     cond: { $eq: ["$$item.uid", ObjectId(loggedUser.id)] }
        //   }
        // },
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
        // myRates: 1,
        // didIRate: { $size: "$myRates" },
        content: {
          // $substrCP: [ "$content", 0, 400 ] 
          $cond: {
            if: {
              $and: [{
              //   $eq: [codes.length, 1]
              // }, {
              //   $eq: ["$is_advanced", 0]
              // }, {
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
                $eq: ["$is_advanced", 0]
              }]
            }, then: 0,
            else: 1
          }
        },
        is_advanced: 1,
        status: 1,
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



  return module;
}
