const { ObjectId } = require("bson");

module.exports = function (db) {
  var module = {};

  module.getMessages = async function (req, res) {
    topic_id = req.body.topic_id;
    lastUpdatedID = req.body.lastUpdatedID;
    const loggedUser = req.user;

    // console.log('[getMessages] topic_id', topic_id)
    // console.log('[getMessages] lastUpdatedID', lastUpdatedID)
    // console.log('[getMessages] loggedUser', loggedUser)

    const ChatCollection = db.collection('chat_replies');
    // const UsersCollection = db.collection('users');

    // // loggedUser info
    // const loggedUserInfo = await UsersCollection.findOne({
    //   username: loggedUser.username
    // })
    // const point = loggedUserInfo.point;
    // const isPremium = loggedUserInfo.premium;

    matchAr = [{
      topic_id: ObjectId(topic_id)
      // }, {
      //   $or: [{
      //     to: { $eq: ObjectId(loggedUser.id) }
      //   }, {
      //     from: { $eq: ObjectId(loggedUser.id) },
      //   }]
    }]

    if (lastUpdatedID != null && lastUpdatedID.length > 0) {
      matchAr.push({
        _id: { $gt: ObjectId(lastUpdatedID) }
      })
    }

    // console.log('matchAr', JSON.stringify(matchAr))

    var items = await ChatCollection.aggregate([{
      $match: {
        $and: matchAr
      }
    }, {
      $lookup:
      {
        from: "users",
        let: { "to_uid": "$to" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$to_uid"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              first_name: 1,
              last_name: 1,
              avatar: 1,
              premium: 1,
              bcoin: 1,
              point: 1
            }
          }
        ],
        as: "to_uinfo",
      }
    }, {
      $unwind:
      {
        path: "$to_uinfo",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $lookup:
      {
        from: "users",
        let: { "from_uid": "$from" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$from_uid"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              first_name: 1,
              last_name: 1,
              avatar: 1,
              premium: 1,
              bcoin: 1,
              point: 1
            }
          }
        ],
        as: "from_uinfo",
      }
    }, {
      $unwind:
      {
        path: "$from_uinfo",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $project:
      {
        _id: 1,
        content: 1,
        to: 1,
        from: 1,
        to_uinfo: 1,
        from_uinfo: 1,
        topic_id: 1,
        // topic: 1,
        aid: 1,
        // astro_data: 1,
        type: 1,
        cmd: 1,
        session_len: 1,
        sent_time: 1,
        received_time: 1
      }
    }]).toArray();

    // console.log('[/astrologer/chat] items', items)

    return res.send({
      status: 'success',
      data: items
    });
  };



  module.getTopics = async function (req, res) {
    const loggedUser = req.user;

    lastUpdatedID = req.body.lastUpdatedID;
    topicID = req.body.topicID;

    const ChatTopicsCollection = db.collection('chat_topics');

    var mAr = {
      // $and: [{
      //   _id: { $eq: ObjectId() }
      // }]
      with: { $eq: ObjectId(loggedUser.id) }
    }

    if (topicID != null) {
      console.log('topicID', topicID)
      mAr = {
        $and: [{
          _id: { $eq: ObjectId(topicID) }
        }, {
          with: { $eq: ObjectId(loggedUser.id) }
        }]        
      }
    }
    console.log('mAr', mAr)

    var items = await ChatTopicsCollection.aggregate([{
      $match: mAr
    }, {
      $lookup:
      {
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
              username: 1,
              first_name: 1,
              last_name: 1,
              avatar: 1,
              premium: 1,
              bcoin: 1,
              point: 1
            }
          }
        ],
        as: "with_uinfo",
      }
    }, {
      $unwind:
      {
        path: "$with_uinfo",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $lookup:
      {
        from: "users",
        let: { "with_uid": "$with" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$with_uid"]
              }
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              first_name: 1,
              last_name: 1,
              avatar: 1,
              premium: 1,
              bcoin: 1,
              point: 1
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
    }, {
      $lookup:
      {
        from: "chat_replies",
        let: { "topic_id": "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{
                  $eq: ["$topic_id", "$$topic_id"]
                }, {
                  $ne: ["$cmd", null]
                }, {
                  $ne: ["$cmd", ""]
                }]
              }
            }
          },
          {
            $project: {
              to: 1,
              from: 1,
              content: 1,
              cmd: 1,
              session_len: 1,
              sent_time: 1,
              received_time: 1
            }
          }, {
            $sort: {
              received_time: -1
            }
          }, {
            $limit: 1
          }
        ],
        as: "last_cmd",
      }
    }, {
      $unwind:
      {
        path: "$last_cmd",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $lookup:
      {
        from: "chat_replies",
        let: { "topic_id": "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$topic_id", "$$topic_id"]
              }
            }
          },
          {
            $project: {
              to: 1,
              from: 1,
              content: 1,
              cmd: 1,
              sent_time: 1,
              received_time: 1
            }
          }, {
            $sort: {
              received_time: -1,
              // sent_time: -1
            }
          }, {
            $limit: 1
          }
        ],
        as: "last_msg",
      }
    }, {
      $unwind:
      {
        path: "$last_msg",
        preserveNullAndEmptyArrays: true
      }
      // }, {
      //   $project:
      //   {
      //     _id: 1,
      //     content: 1,
      //     to: 1,
      //     with: 1,
      //     uinfo: 1,
      //     with_uinfo: 1,
      //     status: 1,
      //     sent_time: 1,
      //     received_time: 1
      //   }
    }, {
      $sort: {
        "last_msg.received_time": -1
      }
    }, {
      $group: {
        _id: "$uid",
        topics: { $push: "$$ROOT" }
      }
    }]).toArray();

    return res.send({
      status: 'success',
      data: items
    });
  }


  module.sendChat = async function (req, res) {
    const loggedUser = req.user;

    content = req.body.content;
    sent_time = req.body.sent_time;
    to = req.body.to;
    aid = req.body.aid;
    topic_id = req.body.topic_id;
    cmd = req.body.cmd;
    type = req.body.type;

    // console.log('[sendChat] req.body', req.body)

    if (content == null || content.length === 0 || to == null || to.length === 0 || aid == null || aid.length === 0 || topic_id == null || topic_id.length === 0) {
      return res.status(403).send({
        success: false,
        message: 'missing fields'
      })
    }

    if (cmd == null) {
      cmd = '';
    }

    const ChatTopicsCollection = db.collection('chat_topics');

    to = ObjectId(to)
    topic_id = ObjectId(topic_id)
    aid = ObjectId(aid)

    const chat_data = {
      topic_id: topic_id,
      content: content,
      from: ObjectId(loggedUser.id),
      to: to,
      aid: aid,
      cmd: cmd,
      sent_time: new Date(),
      received_time: new Date(),
    }

    console.log('chat_data', chat_data)

    const ChatCollection = db.collection('chat_replies');

    try {
      const result = await ChatCollection.insertOne(chat_data, { safe: true })

      if (cmd == 'close') { // close the topic
        await ChatTopicsCollection.updateOne({ _id: topic_id }, {
          $set: { status: 'close' }
        }, { safe: true });
      }

    // console.log('Success: ' + JSON.stringify(result));
      console.log('Success ', result);
      return res.send({
        status: 'success',
        data: chat_data
      });
    }
    catch (error) {
      console.log('> error', error)
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }

  return module;
}
