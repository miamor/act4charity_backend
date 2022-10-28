const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
// const { user_builder } = require('../../record_builder/user_builder') //! change this

module.exports = function (db) {
  var module = {}

  querier.db = db
  const collection_name = 'users' //! change this


  /* ****************************
   * 
   * Query a specific record by id
   * 
   * ****************************/
  module.getById = async function (req, res) {
    const user_id = ObjectId(req.body.user_id)

    const aggAr = [{
      $match: {
        $expr: {
          $eq: ["$_id", user_id]
        }
      }
    }, {
      $lookup: {
        from: "challenge_story",
        let: { "user_id": "$_id" },
        pipeline: [{
          $match: {
            $expr: {
              $and: [
                { $eq: ["$user", "$$user_id"] },
                { $eq: ["$public", true] },
              ]
            }
          }
        }],
        as: "stories"
      }
    }, {
      $lookup: {
        from: "feeds",
        let: { "user_id": "$_id" },
        pipeline: [{
          $match: {
            $expr: {
              $and: [
                { $eq: ["$user", "$$user_id"] },
                { $eq: ["$public", true] },
              ]
            }
          }
        }],
        as: "feeds"
      }
    }]

    const TheCollection = db.collection(collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()
    // let item = await TheCollection.findOne({ _id: user_id })

    let item = items[0]

    item.n_completed = await db.collection('challenge_accepted').countDocuments({ user: user_id, active: 2 })

    return res.send({
      status: 'success',
      data: item
    })
  }


  /* ****************************
   * 
   * Retrieve a list of records
   * ----
   * Params:
      {
        "filter": {
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
      return res.status(505).send({
        status: 'error',
        message: 'Missing params'
      })
    }

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    return querier.getList(res, filter, page, num_per_page, do_count)
  }



  /* ****************************
   * 
   * Find users by username
   *
   * ****************************/
  module.findByUsername = async function (req, res) {
    querier.collection_name = collection_name

    const params = req.body

    if (params.username == null) {
      return res.status(500).send({
        status: 'error',
        message: 'Missing params'
      })
    }

    const TheCollection = db.collection(collection_name)
    const items = await TheCollection.find({ username: { $regex: params.username } }).project({ username: 1 }).toArray()

    return res.send({
      status: 'success',
      data: items
    })
  }



  /* ****************************
   * 
   * Top active members
   *
   * ****************************/
  module.topMembers = async function (req, res) {
    querier.collection_name = collection_name

    const params = req.body

    const TheCollection = db.collection(collection_name)
    const items = await TheCollection.find().project({ _id: 1, username: 1, avatar: 1, firstname: 1, current_donation: 1, current_reward: 1 }).sort({ current_donation: -1, current_reward: -1 }).limit(10).toArray()

    return res.send({
      status: 'success',
      data: items
    })
  }


  return module
}
