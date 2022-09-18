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

    // console.log('[/user/chat] getMessages', items)

    return res.send({
      status: 'success',
      data: items
    });
  };



  module.getTopics = async function (req, res) {
    const loggedUser = req.user;

    lastUpdatedID = req.body.lastUpdatedID;
    topicID = req.body.topicID;
    done = req.body.done;
    console.log('[/user/topics][getTopics] req.body', req.body);

    const ChatTopicsCollection = db.collection('chat_topics');

    var mAr = {
      $and: [{
        uid: { $eq: ObjectId(loggedUser.id) }
      }, {
        $or: [{
          type: { $ne: null }
        }, {
          is_assigned: { $ne: true }
        }]
      }]
    }

    if (topicID != null) {
      console.log('topicID', topicID)
      mAr["$and"].push({
        _id: { $eq: ObjectId(topicID) }
      })
    }
    console.log('mAr', JSON.stringify(mAr))

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
    }, {
      $project:
      {
        _id: 1,
        content: 1,
        aid: 1,
        uid: 1,
        with: 1,
        uinfo: 1,
        with_uinfo: 1,
        status: 1,
        last_cmd: 1,
        last_msg: 1,
        sent_time: "$last_msg.sent_time",
        received_time: "$last_msg.received_time"
      }
    }, {
      $sort: {
        "status": -1,
        "last_msg.received_time": -1,
        "last_msg.sent_time": -1
      }
    // }, {
    //   $group: {
    //     _id: "$with",
    //     topics: { $push: "$$ROOT" }
    //   }
    }]).toArray();

    console.log('items', JSON.stringify(items));

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
    session_len = req.body.session_len;
    new_topic = req.body.new_topic;

    console.log('[/user/chat][sendChat] req.body', req.body)

    if (content == null || content.length === 0 || to == null || to.length === 0 || aid == null || aid.length === 0 || ((topic_id == null || topic_id.length === 0) && (new_topic == null || new_topic == false) && (cmd === 'book' && (session_len == null || !req.body.hasOwnProperty('session_len'))))) {
      return res.status(403).send({
        success: false,
        message: 'missing fields'
      })
    }
    if (cmd == null) {
      cmd = '';
    }

    session_len = Number(req.body.session_len);

    const ChatTopicsCollection = db.collection('chat_topics');

    var topicData = null;
    if ((topic_id == null || topic_id.length === 0) && new_topic == true) {
      topicData = {
        with: ObjectId(to),
        uid: ObjectId(loggedUser.id),
        content: content,
        aid: ObjectId(aid),
        type: type,
        sent_time: new Date(sent_time),
        received_time: new Date(),
        status: 'open'
      }
      console.log('[/user/chat][sendChat] new topic', topicData);
      const ins_topic_res = await ChatTopicsCollection.insertOne(topicData, { safe: true });
      topic_id = ins_topic_res.insertedId;
      topicData._id = topic_id;
    }

    // if (session_len != null) {
    //   session_len = int(session_len)
    // }
    console.log('[/user/chat][sendChat] session_len', session_len)

    to = ObjectId(to)
    topic_id = ObjectId(topic_id)
    aid = ObjectId(aid)

    const ChatCollection = db.collection('chat_replies');

    // get last cmd
    // const lastCmd = await ChatCollection.findOne({
    //   topic_id: topic_id,
    //   cmd: { $ne: '' }
    // }, { cmd: 1, content: 1, session_len: 1 });
    mAr = [{
      $match: {
        $and: [{
          topic_id: { $eq: topic_id }
        }, {
          cmd: { $ne: '' }
        }]
      }
    }, {
      $sort: {
        received_time: -1,
        sent_time: -1
      }
    }, {
      $limit: 1
    }]
    // console.log('mAr', JSON.stringify(mAr))
    const lastCmds = await ChatCollection.aggregate(mAr).toArray();
    const lastCmd = lastCmds[0];

    // console.log('lastCmd', lastCmd)

    var meCoin = 0;
    const UsersCollection = db.collection('users');
    // get my bcoin
    const me_info = await UsersCollection.findOne({
      username: loggedUser.username
    }, { bcoin: 1 });
    meCoin = me_info.bcoin;

    if (lastCmd != null && lastCmd.cmd == 'close') {
      return res.status(403).send({
        success: false,
        message: 'topic is closed'
      })
    }

    if (cmd == 'book') {
      if (lastCmd != null && lastCmd.cmd == 'start') {
        return res.status(403).send({
          success: false,
          message: 'is there a session running ?'
        })
      }

      console.log('[/user/chat][sendChat] here ?')

      if (lastCmd == null || lastCmd.cmd != 'book') { // only subtract coin at the first booking
        // get astrologer info to get price
        const as_uinfo = await UsersCollection.findOne({
          _id: to
        }, { price: 1 });

        // substract coin first
        const coinToSubstract = session_len * as_uinfo.price

        if (me_info.bcoin == null || me_info.bcoin < coinToSubstract) {
          return res.status(403).send({
            success: false,
            message: 'not enough coin'
          })
        }

        // ok. substract
        meCoin = me_info.bcoin - coinToSubstract;
        console.log('me_info.bcoin - coinToSubstract =', me_info.bcoin, '-', coinToSubstract, '=', meCoin);
        try {
          console.log('here ?', loggedUser.id, loggedUser.username, me_info.bcoin, coinToSubstract, meCoin)

          await UsersCollection.updateOne({
            // username: loggedUser.username
            _id: ObjectId(loggedUser.id),
          }, {
            $set: {
              bcoin: meCoin
              // bcoin: 3000
            }
          });
        }
        catch (error) {
          return res.status(403).send({
            success: false,
            message: 'Oops. ' + error
          })
        }
      }
    }

    if (cmd == 'start' && (lastCmd == null || lastCmd.cmd == 'book')) {
      session_len = lastCmd.session_len
    }

    if (cmd == 'stop') {
      if (lastCmd == null || lastCmd.cmd != 'start') {
        return res.status(403).send({
          success: false,
          message: 'no session started'
        })
      }

      const startTime = new Date(lastCmd.content);
      // const endTime = new Date(content); 
      const endTime = new Date(); // end time is now
      content = endTime;
      const difference = Math.abs(endTime.getTime() - startTime.getTime()); // passed time
      const passed_minutes = parseInt(difference / (1000 * 60) % 60); // passed minutes
      const left_minutes = lastCmd.session_len - passed_minutes;

      // get astrologer info to get price
      const as_uinfo = await UsersCollection.findOne({
        _id: to
      }, { price: 1 });

      // add back coin first
      const coinToAdd = left_minutes * as_uinfo.price
      console.log('left_minutes * as_uinfo.price =', left_minutes, '*', as_uinfo.price, '=', coinToAdd);

      // ok. add back
      meCoin = me_info.bcoin + coinToAdd;
      console.log('me_info.bcoin + coinToAdd =', me_info.bcoin, '+', coinToAdd, '=', meCoin);
      try {
        await UsersCollection.updateOne({
          // username: loggedUser.username
          _id: ObjectId(loggedUser.id),
        }, {
          $set: {
            bcoin: meCoin
          }
        });
      }
      catch (error) {
        return res.status(403).send({
          success: false,
          message: 'Oops. ' + error
        })
      }
    }
    // console.log('[/user/chat][sendChat] >> lastCmd', lastCmd)

    var chat_data = {
      topic_id: topic_id,
      content: content,
      from: ObjectId(loggedUser.id),
      to: to,
      aid: aid,
      cmd: cmd,
      // session_len: session_len,
      sent_time: new Date(sent_time),
      received_time: new Date(),
    }
    if (session_len != null) {
      chat_data.session_len = session_len
    }

    console.log('[/user/chat][sendChat] chat_data', chat_data)

    try {
      if (cmd == 'book' && lastCmd != null && lastCmd.cmd == 'book') { // update the booking
        chat_data = {
          content: content,
          session_len: lastCmd.session_len
          // sent_time: new Date(sent_time),
          // received_time: new Date(),
        }
        const result = await ChatCollection.updateOne({ _id: ObjectId(lastCmd._id) }, {
          $set: chat_data
        }, { safe: true })
        // console.log('Success: ' + JSON.stringify(result));
        console.log('Success edit book ', result);
        return res.send({
          status: 'success',
          data: chat_data,
          mycoin: meCoin
        });
      } else {
        const result = await ChatCollection.insertOne(chat_data, { safe: true })

        if (cmd == 'close') { // close the topic
          await ChatTopicsCollection.updateOne({ _id: topic_id }, {
            $set: { status: 'close' }
          }, { safe: true });
        }

        // console.log('Success: ' + JSON.stringify(result));
        // console.log('Success ', result);
        return res.send({
          status: 'success',
          data: chat_data,
          topic: topicData,
          mycoin: meCoin
        });
      }
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
