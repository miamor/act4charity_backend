const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
// const { challenge_builder } = require('../record_builder/challenge_builder') //! change this

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
    $project: {
      interest: 0,
      place: 0,
      charity: 0,
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

    var params = req.body
    // console.log('params', params)

    if (!params.hasOwnProperty('filter') || !params.hasOwnProperty('page') || !params.hasOwnProperty('num_per_page') || !params.hasOwnProperty('do_count')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true


    var aggAr = agg_join_query

    console.log('aggAr', aggAr)


    return querier.getListAdvanced(res, filter, aggAr, page, num_per_page, do_count)
  }



  /* ****************************
   * 
   * Retrieve my completed challenges
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
   * Join a challenge by challenge id
   * 
   * ****************************/
  module.joinById = async function (req, res) {
    querier.collection_name = collection_name
    
    var mode = req.body.mode //? individual | team
    var challenge_id = ObjectId(req.body.challenge_id) //? challenge_id
    var participants = req.body.participants //? [..., ...] list of participants (user id) | if it's 

    const insert_data = {
      challenge: challenge_id,
      users: participants,
      mode: mode,

      //? 1: is in this challenge 
      //? 0: being called for challenge. As in team challenge, when a user invites users, this request will be created with active = 0. When all users accept to join the team (click Accept) this active field will be set to 1
      //? -1: cancel
      //? 2: finished
      active: 1
    }

    /*
     * Add to challenge_accepted table
     */
    const TheCollection = db.collection('challenge_accepted')
    try {
      const inserted_data = await TheCollection.insertOne(insert_data, { safe: true })
      return res.send({
        status: 'success',
        data: insert_data
      })
    }
    catch (error) {
      return res.status(500).send({
        status: 'error',
        message: JSON.stringify(error)
      })
    }

    return res.send({
      status: 'success',
      data: {}
    })
  }


  return module
}
