const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../modules/querier')
// const { challenge_builder } = require('../record_builder/challenge_builder') //! change this

module.exports = function (db) {
  var module = {}

  querier.db = db
  const collection_name = 'challenges' //! change this


  /* ****************************
   * 
   * Query a specific record by id
   * 
   * ****************************/
  module.getById = async function (req, res) {
    querier.collection_name = collection_name
    
    return querier.getById(req, res)
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

    if ( !params.hasOwnProperty('page') || !params.hasOwnProperty('num_per_page') || !params.hasOwnProperty('do_count')) {
      return res.status(505).send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var filter = params.filter || {},
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    return querier.getList(res, filter, page, num_per_page, do_count)
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


  return module
}
