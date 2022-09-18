const noti_handler = require('../../modules/noti_handler')
const querier = require('../../modules/querier')
const { charity_act_builder } = require('../../record_builder/charity_act_builder')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'files_capture'
  noti_handler.db = db


  /* ****************************
   * 
   * Add a record
   * ----
   * Really inserting one record at a time is not really efficient. 
   * Just leave it here for no reason.
   * ------------
   * Params:
    {
      data: {},
      do_static_check: bool
    }
   * Need `do_static_check` because the python script to capture and extract files might already run static check
   * 
   * ****************************/
  module.addOne = async function (req, res) {
    var capture_data = req.body.data

    var do_static_check = false
    if (req.body.hasOwnProperty('do_static_check')) {
      do_static_check = req.body.do_static_check || do_static_check
    }

    captureJson = charity_act_builder(capture_data)

    if (captureJson == null) {
      return res.send({
        status: 'error',
        message: 'Missing data to build record'
      })
    }

    if (do_static_check) {
      captureJson = await detectors.static4file(upload_data.file_path, captureJson)
      console.log('\t >> run static done ')
    }

    querier.insertOne(req, res, captureJson)
  }


  /* ****************************
   * 
   * Add multiple records
   * ----
   * Use this api when want to insert a batch of files extracted
   * ------------
   * Params:
    {
      data: [],
      do_static_check: bool
    }
   * Need `do_static_check` because the python script to capture and extract files might already run static check
   * 
   * ****************************/
  module.addMany = async function (req, res) {
    var capture_datas = req.body.data

    const do_static_check = req.body.do_static_check || false

    var errAr = []
    var captureJsons = []
    await Promise.all(capture_datas.map(async capture_data => {
      var captureJson = charity_act_builder(capture_data)

      console.log('captureJson', captureJson)

      if (captureJson == null) {
        errAr.push(`Fail to process ${capture_data.file_path} : Can't build record`)
      } 
      else {
        if (do_static_check) {
          captureJson = await detectors.static4file(capture_data.file_path, captureJson)
          console.log('\t >> run static done ')
        }

        captureJsons.push(captureJson)
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
    return querier.insertMany(req, res, captureJsons)
  }


  return module
}
