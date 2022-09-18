const querier = require('../../modules/querier')
const { task_builder } = require('../../record_builder/task_builder')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'tasks'


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
          "uid": string, 
          "type": string,
          "otype": string
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

    if (!filter.hasOwnProperty('uid') || !filter.hasOwnProperty('type') || !filter.hasOwnProperty('otype')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var uid = filter.uid,
      type = filter.type,
      otype = filter.otype

    /* 
     * Reconstruct filter 
     */
    //! TODO

    return querier.getList(res, filter, page, num_per_page, do_count)
  }


  /* ****************************
   * 
   * Add a record
   * 
   * ****************************/
  module.add = async function (req, res) {

    /* 
     * loop through uploaded paths
     */
    var taskJson = task_builder({
      paths: req.body.paths,
      otype: req.body.otype,
      type: req.body.type,
      flow: req.body.flow
    }, db)


    if (taskJson == null) {
      return res.send({
        status: 'error',
        message: 'Can\'t build record'
      })
    }


    /* 
     * Insert all records to db 
     */
    return querier.insertOne(req, res, taskJson)
  }


  return module
}
