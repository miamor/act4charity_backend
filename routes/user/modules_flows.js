const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const { module_flow_builder } = require('../../record_builder/modules_flow_builder')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'modules_flows'

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
          "otype": string,
          "enabled": bool
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

    if (!filter.hasOwnProperty('otype') || !filter.hasOwnProperty('enabled')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var uid = filter.uid,
      otype = filter.otype,
      enabled = filter.enabled

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
    var moduleFlowJson = module_flow_builder(req.body)

    if (moduleFlowJson == null) {
      return res.send({
        status: 'error',
        message: 'Missing data to build record'
      })
    }

    /* If created by user, `enabled` must be `false` */
    moduleFlowJson.enabled = false

    return querier.insertOne(req, res, moduleFlowJson)
  }


  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  module.update = async function (req, res) {
    var moduleFlowJson = module_flow_builder(req.body)

    /* If created by user, `enabled` must be `false` */
    moduleFlowJson.enabled = false

    return querier.updateOne(req, res, moduleFlowJson, { _id: ObjectId(id), insert_uid: ObjectId(loggedUser.id) })
  }


  return module
}
