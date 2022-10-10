const { ObjectId } = require('mongodb')
const querier = require('../modules/querier')
const { test_builder } = require('../record_builder/test_builder') //! change this

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'test' //! change this


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

    return querier.getList(res, filter, page, num_per_page, do_count)
  }


  /* ****************************
   * 
   * Add a record
   * ----
   * Really inserting one record at a time is not really efficient. 
   * Just leave it here for no reason.
   * ------------
   * Params:
    {
      ... // data to insert to db here
    }
   * 
   * ****************************/
  module.add = async function (req, res) {
    const testJson = test_builder(req.body) //! change this

    return querier.insertOne(req, res, testJson)
  }


  /* ****************************
   * 
   * Add multiple records
   * ----
   * Use this api when want to insert a batch of data
   * ------------
   * Params:
    {
      data: [],
    }
   * 
   * ****************************/
  module.addMany = async function (req, res) {
    var test_datas = req.body.data

    var errAr = []
    var testJsons = []
    await Promise.all(test_datas.map(async test_data => {
      const testJson = test_builder(test_data) //! change this
      if (testJson == null) {
        errAr.push(`Fail to process ${JSON.stringify(test_data)} : Can't build record`)
      } else {
        testJsons.push(testJson)
      }
    }))


    /* 
     * Do not return error if any element failed to be processed anymore
     * Instead, just push to notification to let users know some uploaded data got failed to process
     */
    if (errAr.length > 0) {
      // return res.send({
      //   status: 'error',
      //   message: errAr.join('\n')
      // })
      // noti_handler.pushMsgs(req, errAr)
    }


    /* 
     * Insert all records to db 
     */
    return querier.insertMany(req, res, testJsons)
  }


  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  module.update = async function (req, res) {
    const testJson = test_builder(req.body) //! change this

    return querier.updateOne(req, res, testJson)
  }


  /* ****************************
   * 
   * Delete a record
   * 
   * ****************************/
  module.delete = async function (req, res) {
    return querier.deleteById(req, res)
  }


  return module
}
