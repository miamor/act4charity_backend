const { ObjectId } = require('mongodb') // or ObjectID 
const { history_analyze_builder } = require('../../record_builder/history_analyze_builder')
const querier = require('../../modules/querier')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'history_analyze'


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
   * 
   * ****************************/
  module.getList = async function (req, res) {
    /*
     * Params:
     * All these are mandatory and must be parsed
     * If no filter, parse null
     * ------------------
     *
      {
        "filter": {
          "otype": string, (`file` | `url` | `traffic`)

          "path": string, 
          "type": array, (eg. ['processor', 'detector'])
          "ttype": array, (['capture', 'upload'])
          "hash": string,
          "detected_type": array, (eg. ['malware', 'benign'])
          "module": array,

          "file_name": string, (for `file`, empty for url analysis history search)
        },
        "page": int,
        "num_per_page": int,
        "do_count": bool
      }
     */
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

    if (!filter.hasOwnProperty('path') || !filter.hasOwnProperty('module') || !filter.hasOwnProperty('ttype') || !filter.hasOwnProperty('hash') || !filter.hasOwnProperty('detected_type') || !filter.hasOwnProperty('file_name')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var otype = filter.otype,
      path = filter.path,
      type = filter.type,
      ttype = filter.ttype,
      hash = filter.hash,
      detected_type = filter.detected_type,
      module = filter.module,
      file_name = filter.file_name

    /* 
     * Reconstruct filter 
     */
    //! TODO

    return querier.getList(res, filter, page, num_per_page, do_count)
  }


  return module
}
