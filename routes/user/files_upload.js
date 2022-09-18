const { ObjectId } = require('mongodb') // or ObjectID 
const { file_upload_builder } = require('../../record_builder/file_upload_builder')
const detectors = require('../../modules/detectors')
const uploader = require('../../modules/uploader')
const querier = require('../../modules/querier')
const noti_handler = require('../../modules/noti_handler')
const { hashFiles } = require('../../modules/detectors')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'files_upload'
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
          "hash": string,
          "type": array,
          "file_name": string,
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

    if (!filter.hasOwnProperty('hash') || !filter.hasOwnProperty('type') || !filter.hasOwnProperty('file_name') || !filter.hasOwnProperty('analyzed')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var hash = filter.hash,
      type = filter.type,
      file_name = filter.file_name,
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
   * Upload files
   * When a user upload a file, always run static check first
   * ---
   * If one file failed to upload or failed to build record, the whole batch will not be processed.
   * 
   * ****************************/
  module.upload = async function (req, res) {
    /*
     * first upload files
     */
    var upload_res = uploader.uploadFile(req, res)
    if (upload_res.status === 'error') {
      return res.send({
        status: 'error',
        message: upload_res
      })
    }

    files_data = upload_res.data


    /* 
     * Get all types of hashes of all files in one command
     */
    const filepaths = files_data.map(file_data => file_data.file_path)
    var hashes_dict = {
      md5: {},
      sha1: {},
      sha256: {},
      sha512: {},
      ssdeep: {}
    }
    hashes_dict = await hashFiles(filepaths, hashes_dict)

    /* 
     * loop through uploaded files,
     * run basic detectors
     */
    var errAr = []
    var uploadJsons = []
    await Promise.all(files_data.map(async upload_data => {
      ['md5', 'sha1', 'sha256', 'sha512', 'ssdeep'].map(htype => {
        upload_data[htype] = hashes_dict[htype][upload_data.file_path]
      })
      
      var uploadJson = file_upload_builder(upload_data)

      if (uploadJson == null) {
        errAr.push('Can\'t build record')
      } 
      else {
        uploadJson = await detectors.static4file(upload_data.file_path, uploadJson)
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
    const uploadJson = file_upload_builder(req.body)

    return querier.updateOne(req, res, uploadJson)
  }


  return module
}
