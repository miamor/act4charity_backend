const { ObjectId } = require('mongodb') // or ObjectID 
const { url_upload_builder } = require('../../record_builder/url_upload_builder')
const querier = require('../../modules/querier')
const noti_handler = require('../../modules/noti_handler')
const detectors = require('../../modules/detectors')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'urls_upload'
  noti_handler.db = db


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


  /* ****************************
   * 
   * Upload urls
   * When a user upload a url, always run static check first (if there's any)
   * ----
   * Params:
      {
        urls: []
      }
   * 
   * ****************************/
  module.upload = async function (req, res) {
    urls_data = req.body.urls

    if (urls == null || urls.length === 0) {
      return res.send({
        status: 'error',
        message: 'No urls provided'
      })
    }

    /* 
     * loop through uploaded urls,
     * run basic detectors
     */
    var errAr = []
    var uploadJsons = []
    await Promise.all(urls_data.map(async upload_data => {
      var uploadJson = url_upload_builder(upload_data)

      if (uploadJson == null) {
        errAr.push('Can\'t build record')
      }
      else {
        //? run static detector for url here
        uploadJson = await detectors.static4url(upload_data.url_path, uploadJson)
        console.log('\t >> run static done ')
        // console.log('\t >> run static done ')

        uploadJsons.push(uploadJson)
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
      noti_handler.pushMsgs(req, errAr)
    }


    /* 
     * Insert all records to db 
     */
    return querier.insertMany(req, res, uploadJsons)
  }


  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  module.update = async function (req, res) {
    const uploadJson = url_upload_builder(req.body)

    return querier.updateOne(req, res, uploadJson)
  }


  return module
}
