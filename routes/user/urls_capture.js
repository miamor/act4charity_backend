const { ObjectId } = require('mongodb') // or ObjectID 
const { url_capture_builder } = require('../../record_builder/url_capture_builder')
const querier = require('../../modules/querier')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'urls_capture'


  /* ****************************
   * 
   * Query a specific record by id
   * 
   * ****************************/
  module.getById = async function (req, res) {
    return querier.getById(req, res)
  }


  /* ****************************
   * 
   * Retrieve a list of records
   * ----
   * Params:
    {
      "filter": {
        "url": string,
        "analyzed": bool
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

    if (!filter.hasOwnProperty('url') || !filter.hasOwnProperty('analyzed')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var url = filter.url,
      analyzed = filter.analyzed    //? 0: did not run external analyzing modules yet. (only run traditional detectors)
    //? 1: did run run external analyzing modules. 

    /* 
     * Reconstruct filter 
     */
    //! TODO

    return querier.getList(res, filter, page, num_per_page, do_count)
  }
  

  return module
}
