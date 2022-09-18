
  module.findByCode = async function (req, res) {
    code = req.params.code;
    isFull = req.body.full;
    const loggedUser = req.user;
    // console.log(req.user);
    console.log('code', code)

    const DataCollection = db.collection('data');
    const UsersCollection = db.collection('users');

    // loggedUser info
    const loggedUserInfo = await UsersCollection.findOne({
      username: loggedUser.username
    })
    const point = loggedUserInfo.point;
    const isPremium = loggedUserInfo.premium;

    console.log('point', point)

    var items = await DataCollection.aggregate([{
      $match: {
        $and: [{
          code: code
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

            ret_ar[item._id] = item_data
            // console.log('  > ret_ar', ret_ar)
          }
          catch (error) {
            console.log('[/user/data][findByCodes] error', error)
          }
        }
      }))

      // // console.log('ret_ar', ret_ar);
    }
    return res.send({
      status: 'success',
      data: ret_ar
    });
    // });
  };