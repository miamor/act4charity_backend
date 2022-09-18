const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'users'

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
    var user = req.body

    return querier.insertOne(req, res, user)
  }


  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  module.update = async function (req, res) {
    var user = req.body
    var id = ObjectId(user._id)
    delete user['_id']
    delete user['username'] // keep old username
    delete user['password'] // keep old password

    querier.updateOne(req, res, user)
  }


  module.delete = async function (req, res) {
    return querier.deleteById(req, res)
  }


  return module
}
