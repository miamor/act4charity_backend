const { ObjectId } = require('mongodb'); // or ObjectID 

module.exports = function (db) {
  var module = {};

  module.find = async function (req, res) {
    console.log('>> req.body', req.body)

    var tbl = req.params.db;
    if (tbl === '_') tbl = 'data';
    else if (["genekeys", "humandesign", "daily", "key_events"]) {
      tbl = 'data_' + tbl;
    } else {
      return res.status(403).send({
        success: false,
        message: 'tbl wrong format'
      })
    }


    var filter = req.body;

    var tags = filter.tags;
    var types = filter.types;
    var sources = filter.sources;
    var is_advanceds = filter.is_advanced;
    var statuses = filter.statuses;
    var assign = filter.assign;
    var page = filter.page;
    var num_per_page = filter.num_per_page;
    var do_count = filter.do_count;
    var id = filter.id;

    if (num_per_page == null) {
      num_per_page = 1;
    }
    if (id == null && page == null) {
      return res.status(403).send({
        success: false,
        message: 'either id or page must be provided'
      })
    }

    const DataCollection = db.collection(tbl);

    matchAr = [{
      status: { $ne: 100 }
    }]
    // {code: /m/}

    if (id != null) {
      matchAr.push({
        _id: { $eq: ObjectId(id) }
      })
    } else {
      if (tags != null && tags.length > 0) {
        tagAr = []
        for (var i = 0; i < tags.length; i++) {
          tagAr.push({
            code: { $regex: tags[i], $options: 'i' }
          })
        }
        // console.log('tagAr', tagAr)
        matchAr.push({
          $or: tagAr
        })
      }
      if (types != null && types.length > 0) {
        typeAr = []
        for (var i = 0; i < types.length; i++) {
          if (types[i] == 'natal') { // match not start with all kind of things @@
            typeAr.push({
              code: { $regex: "^(?!synastry|composite|transit|(horo-love)).*", $options: 'i' }
            })
          } else {
            typeAr.push({
              code: { $regex: "^" + types[i], $options: 'i' }
            })
          }
        }
        // console.log('typeAr', typeAr)
        matchAr.push({
          $or: typeAr
        })
      }
      if (sources != null && sources.length > 0) {
        sourceAr = []
        for (var i = 0; i < sources.length; i++) {
          sourceAr.push({
            sid: { $eq: ObjectId(sources[i]) }
          })
        }
        // console.log('sourceAr', sourceAr)
        matchAr.push({
          $or: sourceAr
        })
      }
      if (statuses != null && statuses.length > 0) {
        statusAr = []
        for (var i = 0; i < statuses.length; i++) {
          statusAr.push({
            status: { $eq: int(statuses[i]) }
          })
        }
        // console.log('statusAr', statusAr)
        matchAr.push({
          $or: statusAr
        })
      }
      if (is_advanceds != null && is_advanceds.length > 0) {
        is_advancedAr = []
        for (var i = 0; i < is_advanceds.length; i++) {
          is_advancedAr.push({
            is_advanced: { $eq: int(is_advanceds[i]) }
          })
        }
        // console.log('is_advancedAr', is_advancedAr)
        matchAr.push({
          $or: is_advancedAr
        })
      }

      if (assign != null && assign.length === 24) {
        matchAr.push({
          assign: ObjectId(assign)
        })
      }
    }


    console.log('matchAr', matchAr)

    // db.orders.countDocuments({ ord_dt: { $gt: new Date('01/01/2012') } }, { limit: 100 })
    // var count = await DataCollection.countDocuments([{
    //   $match: {
    //     $and: matchAr
    //   }
    // }, {
    //   $count: "total"
    // }]).toArray();

    aggregateAr = [{
      $match: {
        $and: matchAr
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
        day: 1, //daily
        sign: 1, //daily
        key: 1, //genekey
        key_phrase: 1, //genekey
        lang: 1,
        sid: 1,
        source: 1,
        trans: 1,
        event: 1, //key_events
        title: 1,
        content: {
          $cond: {
            if: {
              $or: [{
                $ne: [id, null]
              }, {
                content: { $type: "object" }
              }]
            }, then: "$content",
            else: {
              $substrCP: ["$content", 0, 200]
            }
          }
        },
        // is_content_trimmed: 0,
        is_advanced: 1,
        status: 1,
      }
    }]

    if (id == null) {
      if (tbl == "data_daily" || tbl == "data_key_events") {
        aggregateAr.push({
          $sort: {
            day: -1
          }
        })
      }
      aggregateAr.push({
        $facet: {
          paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
          totalCount: [
            {
              $count: 'total'
            }
          ]
        }
      })
      // aggregateAr.push({
      //   $skip: (page - 1) * num_per_page
      // })
      // aggregateAr.push({
      //   $limit: num_per_page
      // })
    }
    console.log(JSON.stringify(aggregateAr))
    var items = await DataCollection.aggregate(aggregateAr).toArray();

    // var ret_ar = {}
    // if (items != null && items.length > 0) {
    //   // var subPoint = false;

    //   await Promise.all(items.map(async function (item) {
    //     var item_data = item.data;
    //     // console.log('item_data', item_data)
    //     ret_ar[item._id] = item_data
    //   }))

    //   // console.log('ret_ar', ret_ar);
    // }
    console.log('items', items)
    return res.send({
      status: 'success',
      // data: ret_ar
      data: id == null ? items[0].paginatedResults : items,
      total: id == null ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : 1
    });
  };


  module.findByCodes = async function (req, res) {
    var tbl = req.params.db;
    if (tbl === '_') tbl = 'data';
    else if (["genekeys", "humandesign", "daily", "key_events"]) {
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

    // const loggedUser = req.user;
    // console.log(req.user);
    // console.log('codes', codes)
    console.log('tbl', tbl)
    const DataCollection = db.collection(tbl);

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
        lang: 1,
        sid: 1,
        source: 1,
        trans: 1,
        event: 1,
        title: 1,
        content: 1,
        // is_content_trimmed: 0,
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
        // console.log('item_data', item_data)
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


  module.add = async function (req, res) {
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
    var data = req.body;

    var dt = dateTime.create();
    data.created_time = data.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Adding post: ' + JSON.stringify(data));

    const loggedUser = req.user;
    data.uid = ObjectId(loggedUser.id);

    const DataCollection = db.collection('data');
    try {
      const result = await DataCollection.insertOne(data, { safe: true })
      // console.log('Success: ' + JSON.stringify(result));
      return res.send({
        status: 'success',
        data: data
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }

  module.update = async function (req, res) {
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

    var data = req.body;
    if (!data.hasOwnProperty('_id')) {
      return res.status(403).send({
        success: false,
        message: 'no _id provided'
      })
    }
    var id = ObjectId(data._id);
    console.log('Updating data: ' + id);
    delete data._id;

    var dt = dateTime.create();
    data.updated_time = dt.format('Y-m-d H:M:S');

    // console.log(JSON.stringify(data));

    // const loggedUser = req.user;

    const DataCollection = db.collection('data');
    // console.log(JSON.stringify(data));
    try {
      await DataCollection.updateOne({ _id: ObjectId(id) }, {
        $set: data
      })

      // console.log('Success: ' + JSON.stringify(result));
      // console.log('Success ', data);
      return res.send({
        status: 'success',
        data: data
      });
    }
    catch (error) {
      // console.log('~error', error)
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }

  module.delete = async function (req, res) {
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

    var data = req.body;
    if (!data.hasOwnProperty('_id')) {
      return res.status(403).send({
        success: false,
        message: 'no _id provided'
      })
    }
    var id = req.body._id;
    console.log('Deleting data: ' + id);

    const DataCollection = db.collection(tbl);

    try {
      const result = await DataCollection.remove({ _id: ObjectId(id) }, { safe: true })
      return res.send({
        status: 'success',
        // data: req.body //result
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
