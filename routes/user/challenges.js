const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const uploader = require('../../modules/uploader')
// const { challenge_builder } = require('../../record_builder/challenge_builder') //! change this


module.exports = function (db) {
  var module = {}

  querier.db = db
  const collection_name = 'challenges' //! change this

  const agg_join_query = [{
    $lookup: {
      from: "interests",
      let: { "interest_id_list": "$interest" },
      pipeline: [{
        $match: {
          $expr: {
            $in: ["$_id", "$$interest_id_list"]
          }
        }
      }],
      as: "interests_details"
    }
  }, {
    $lookup: {
      from: "charities",
      let: { "charity_id": "$charity" },
      pipeline: [{
        $match: {
          $expr: {
            $eq: ["$_id", "$$charity_id"],
          }
        }
      }],
      as: "charity_detail"
    }
  }, {
    $unwind:
    {
      path: "$charity_detail",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $lookup: {
      from: "sponsors",
      let: { "sponsor_id": "$sponsor" },
      pipeline: [{
        $match: {
          $expr: {
            $eq: ["$_id", "$$sponsor_id"],
          }
        }
      }],
      as: "sponsor_detail"
    }
  }, {
    $unwind:
    {
      path: "$sponsor_detail",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $project: {
      interest: 0,
      place: 0,
      charity: 0,
      sponsor: 0,
    }
  }, {
    $sort: { _id: -1 }
  }]

  const agg_join_place_query = [{
    $lookup: {
      from: "places",
      let: { "place_id": "$place" },
      pipeline: [{
        $match: {
          $expr: {
            $eq: ["$_id", "$$place_id"]
          }
        }
      }],
      as: "place_detail"
    }
  }, {
    $unwind:
    {
      path: "$place_detail",
      preserveNullAndEmptyArrays: false
    }
  }]


  /* ****************************
   * 
   * Query a specific record by id
   * 
   * ****************************/
  module.getById = async function (req, res) {
    querier.collection_name = collection_name

    var aggAr = [{
      $match: {
        _id: { $eq: ObjectId(req.body._id) }
      }
    }]
    aggAr = [...aggAr, ...agg_join_query]

    return querier.getByAggQuery(req, res, aggAr)
  }


  /* ****************************
   * 
   * Retrieve a list of records
   * ----
   * Params:
      {
        "filter": {
          "type": string,  discovery | walk
          "distance"
        },
        "page": int,
        "num_per_page": int,
        "do_count": bool
      }
   *  All these are mandatory and must be parsed
   *  If no filter, parse null
   * 
   * ****************************/
  module.getList = async function (req, res) {
    querier.collection_name = collection_name

    const params = req.body
    // console.log('params', params)

    if (!params.hasOwnProperty('filter') || !params.hasOwnProperty('page') || !params.hasOwnProperty('num_per_page') || !params.hasOwnProperty('do_count')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true


    var aggQ = agg_join_query

    console.log('aggAr', aggQ)


    return querier.getListAdvanced(res, filter, aggQ, page, num_per_page, do_count)
  }



  /* ****************************
   * 
   * Filter `walk`
   * 
   * ****************************/
  module.getListWalk = async function (req, res) {
    querier.collection_name = collection_name

    const params = req.body

    if (!params.hasOwnProperty('filter') || !params.hasOwnProperty('page') || !params.hasOwnProperty('num_per_page') || !params.hasOwnProperty('do_count')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true


    var matchAr = []

    /*
     * Find by user's filter
     */
    for (const [k, v] of Object.entries(filter)) {
      console.log(k, v)
      if (v != null && v.length > 0) {
        matchAr.push({ [k]: { $eq: v } })
      }
    }
    console.log('matchAr', matchAr)


    var aggAr = []

    if (matchAr.length > 0) {
      aggAr.push({
        $match: {
          $and: matchAr
        }
      })
    }


    aggAr = [...aggAr, ...agg_join_query]


    /*
     * Pagination
     */
    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    console.log('aggAr', JSON.stringify(aggAr))



    const TheCollection = db.collection(collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  }




  /* ****************************
   * 
   * Filter `discover` by distance
   * 
   * ****************************/
  module.getListDiscover = async function (req, res) {
    querier.collection_name = collection_name

    const params = req.body

    if (!params.hasOwnProperty('filter') || !params.hasOwnProperty('page') || !params.hasOwnProperty('num_per_page') || !params.hasOwnProperty('do_count')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    if (!filter.hasOwnProperty('user_loc') && !filter.hasOwnProperty('distance')) {
      return res.status(500).send({})
    }

    const user_loc = filter.user_loc
    const distance = filter.distance

    // console.log('>>>> user_loc', user_loc)

    /* 
     * Find places within distance
     */
    var places_ids = []
    if (distance > 0) {
      const filterPlacesQuery = {
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: user_loc },
            $minDistance: 0,
            $maxDistance: distance
          }
        }
      }
      // console.log('>>> filterPlacesQuery', JSON.stringify(filterPlacesQuery))

      const places = await db.collection('places').find(filterPlacesQuery, { _id: 1 }).toArray()
      places_ids = places.map(place => ObjectId(place._id))
    }

    console.log('>>> places_ids', places_ids)


    /*
     * Find challenges to discover those places
     */
    var matchAr = []
    if (places_ids.length > 0) {
      matchAr.push({
        place: { $in: places_ids }
      })
    }

    /*
     * Find by user's filter
     */
    for (const [k, v] of Object.entries(filter)) {
      if (k != 'user_loc' && k != 'distance') {
        console.log(k, v)
        if (v != null && v.length > 0) {
          matchAr.push({ [k]: { $eq: v } })
        }
      }
    }
    console.log('matchAr', matchAr)


    var aggAr = []

    if (matchAr.length > 0) {
      aggAr.push({
        $match: {
          $and: matchAr
        }
      })
    }


    aggAr = [...aggAr, ...agg_join_place_query, ...agg_join_query]


    /*
     * Pagination
     */
    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    console.log('aggAr', JSON.stringify(aggAr))



    const TheCollection = db.collection(collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  }



  /* ****************************
   * 
   * Retrieve all completed challenges
   * 
   * ****************************/
  module.getCompleted = async function (req, res) {
    querier.collection_name = collection_name

    return res.send({})
  }



  /* ****************************
   * 
   * Retrieve list of participants by challenge id
   * 
   * ****************************/
  module.getParticipants = async function (req, res) {
    querier.collection_name = collection_name

    return res.send({})
  }



  /* ****************************
   * 
   * Retrieve invitations list by challenge_accepted_id
   * This is also to retrieve members accept status
   * 
   * ****************************/
  module.getInvitationsById = async function (req, res) {
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)

    const InvCollection = db.collection('challenge_invitation')
    const invitations = await InvCollection.find({ challenge_accepted: challenge_accepted_id }).toArray()

    console.log('challenge_accepted_id', challenge_accepted_id)
    console.log('invitations', invitations)

    return res.send({
      status: 'success',
      data: invitations
    })
  }


  /* ****************************
   * 
   * Accept an invitation to join a team challenge
   * 
   * ****************************/
  module.acceptInvitation = async function (req, res) {
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    const user_id = ObjectId(req.user.id)

    const InvCollection = db.collection('challenge_invitation')
    const updateStt = await InvCollection.updateOne({
      challenge_accepted: challenge_accepted_id,
      to_uid: user_id,
    }, {
      $set: { accept: 1 }
    })

    return res.send({
      status: 'success',
      data: updateStt
    })
  }

  /* ****************************
   * 
   * Decline an invitation
   * 
   * ****************************/
  module.declineInvitation = async function (req, res) {
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    const user_id = ObjectId(req.user.id)

    const InvCollection = db.collection('challenge_invitation')
    const updateStt = await InvCollection.updateOne({
      challenge_accepted: challenge_accepted_id,
      to_uid: user_id,
    }, {
      $set: { accept: -1 }
    })

    return res.send({
      status: 'success',
      data: updateStt
    })
  }

  /* ****************************
   * 
   * Cancel an invitation (accepted, joined the challenge but then cancel)
   * 
   * ****************************/
  module.cancelInvitation = async function (req, res) {
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    const user_id = ObjectId(req.user.id)

    const InvCollection = db.collection('challenge_invitation')
    const updateStt = await InvCollection.updateOne({
      challenge_accepted: challenge_accepted_id,
      to_uid: user_id,
    }, {
      $set: { accept: -2 }
    })

    return res.send({
      status: 'success',
      data: updateStt
    })
  }


  /* ****************************
   * 
   * Cancel by challenge id
   * 
   * ****************************/
  module.cancelById = async function (req, res) {
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    const user_id = ObjectId(req.user.id)

    const TheCollection = db.collection('challenge_accepted')
    const updateStt = await TheCollection.updateOne({
      _id: { $eq: challenge_accepted_id },
      user: { $eq: user_id },
      active: { $eq: 1 }
    }, {
      $set: {
        active: -1 //? cancel
      }
    })

    return res.send({
      status: 'success',
      data: updateStt
    })
  }



  /* ****************************
   * 
   * Complete by challenge id
   * 
   * ****************************/
  module.completeById = async function (req, res) {
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    const user_id = ObjectId(req.user.id)
    const challenge_reward = req.body.challenge_reward || 0
    const challenge_donation = req.body.challenge_donation || 0


    /*
     * Check if the user really completed the challenge
     */


    /*
     * Update challenge_accepted active status
     */
    const TheCollection = db.collection('challenge_accepted')
    const updateStt = await TheCollection.updateOne({
      _id: { $eq: challenge_accepted_id },
      user: { $eq: user_id },
      active: { $eq: 1 }
    }, {
      $set: {
        active: 2 //? finished
      }
    })


    /*
     * Get participants lists
     */
    //! right now just simply use this. but really should not. should retrieve from db instead
    const participants = req.body.participants.map(x => ObjectId(x))


    /* 
     * Update user current_reward and current_donation
     */
    if (challenge_reward > 0 && challenge_donation > 0) {
      const UserCollection = db.collection('users')
      const user_updateStt = await UserCollection.updateMany({
        _id: { $in: participants }
      }, {
        $inc: {
          current_reward: challenge_reward,
          current_donation: challenge_donation,
        }
      })
    }


    // console.log({
    //   _id: { $eq: challenge_accepted_id },
    //   user: { $eq: user_id },
    //   active: { $eq: 1 }
    // })

    return res.send({
      status: 'success',
      data: updateStt
    })
  }



  /* ****************************
   * 
   * Join a challenge by challenge id
   * 
   * ****************************/
  module.joinById = async function (req, res) {
    querier.collection_name = collection_name

    //? individual | team
    const mode = req.body.mode
    //? challenge_id
    const challenge_id = ObjectId(req.body.challenge_id)
    //? [..., ...] list of participants (user id) | if it's 
    const participants = req.body.participants.map(x => ObjectId(x))
    //? user id
    const user_id = ObjectId(req.user.id)

    var insert_data = {
      challenge: challenge_id,
      user: user_id,
      participants: participants,
      mode: mode,

      //? 1: is in challenge (in participating)
      //? 0: waiting to start (in casee of team)
      //? -1: cancel
      //? 2: finished
      active: 1
    }


    /*
     * Add to challenge_accepted table
     */
    const TheCollection = db.collection('challenge_accepted')
    const inserted_data = await TheCollection.insertOne(insert_data, { safe: true })
    // console.log('[joinById] >>> inserted_data', inserted_data)


    let participants_details = [{
      _id: user_id,
      username: req.user.username
    }]

    /*
     * If team mode: send invitation to other participants
     */
    if (mode == 'team') {
      insert_data.active = 0

      //? send invitation
      participants.forEach(async (to) => {
        const invitation_data = {
          challenge_accepted: inserted_data.insertedId,
          challenge: challenge_id, //? actually redundant
          from_uid: user_id,
          to_uid: to,
          accept: 0,
        }
        console.log('>> invitation_data', invitation_data)
        const InvCollection = db.collection('challenge_invitation')
        await InvCollection.insertOne(invitation_data, { safe: true })
      })

      /*
       * Get participants info
       */
      const UserCollection = db.collection('challenge_accepted')
      participants_details = await UserCollection.find({ _id: { $in: participants } }).project({ username: 1, firstname: 1, lastname: 1, _id: 1, profile_picture: 1 }).toArray()
    }


    return res.send({
      status: 'success',
      data: {
        ...insert_data,
        _id: inserted_data.insertedId,
        participants_details: participants_details
      }
    })
  }



  /* ****************************
   * 
   * A host click start challenge
   * delete all unaccepted invitations
   * 
   * ****************************/
  module.startTeamById = async function (req, res) {
    //? challenge_accepted_id
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    //? user id
    const user_id = ObjectId(req.user.id)

    const InvCollection = db.collection('challenge_invitation')
    await InvCollection.deleteMany({
      challenge_accepted: challenge_accepted_id,
      accept: { $lte: 0 }
    })

    const TheCollection = db.collection('challenge_accepted')
    const updateStt = await TheCollection.updateOne({
      _id: challenge_accepted_id,
      user: user_id
    }, {
      $set: { active: 1 }
    })

    return res.send({
      status: 'success',
      data: updateStt
    })
  }




  /* ****************************
   * 
   * Share picture / status during journey
   * 
   * ****************************/
  module.shareStory = async function (req, res) {
    //? challenge_id
    const challenge_id = ObjectId(req.body.challenge_id)
    //? challenge_accepted_id
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    //? user id
    const user_id = ObjectId(req.user.id)

    const public = req.body.public === "false" ? false : true

    /*
     * first upload files
     */
    var upload_res = uploader.uploadFiles(req, res)
    if (upload_res.status === 'error') {
      return res.send({
        status: 'error',
        message: upload_res
      })
    }

    files_data = upload_res.data


    /* 
     * Get path to the uploaded file
     */
    const filepath = files_data[0].file_path
    const file_urlpath = 'http://149.28.157.194:5006/' + filepath.split('/uploads/')[1]


    /*
     * Add to db
     */
    let insert_data = {
      picture: file_urlpath,
      content: req.body.content,
      challenge_accepted: challenge_accepted_id,
      challenge: challenge_id,
      user: user_id,
      public: public
    }
    const TheCollection = db.collection('challenge_story')
    const inserted_data = await TheCollection.insertOne(insert_data, { safe: true })


    return res.send({
      status: 'success',
      data: {
        ...insert_data,
        _id: inserted_data.insertedId
      }
    })
  }



  /* ****************************
   * 
   * List challenge_story
   * 
   * ****************************/
  module.listStory = async function (req, res) {
    //? challenge_accepted_id
    const challenge_id = ObjectId(req.body.challenge_id)

    const TheCollection = db.collection('challenge_story')
    const items = await TheCollection.aggregate([{
      $match: {
        $and: [{
          challenge: { $eq: challenge_id }
        }, {
          public: true
        }]
      }
    }, {
      $lookup: {
        from: "users",
        let: { "user_id": "$user" },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$_id", "$$user_id"],
            }
          }
        }],
        as: "user_detail"
      }
    }, {
      $unwind: {
        path: "$user_detail",
        preserveNullAndEmptyArrays: false
      }
    }, {
      $sort: { _id: -1 }
    }]).toArray()


    return res.send({
      status: 'success',
      data: items
    })
  }



  return module
}
