const detectors = require('../../modules/detectors')
const noti_handler = require('../../modules/noti_handler')
const querier = require('../../modules/querier')
const { url_capture_builder } = require('../../record_builder/url_capture_builder')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'urls_capture'
  noti_handler.db = db


  /* ****************************
   * 
   * Add multiple records
   * ----
   * Use this api when want to insert a batch of urls extracted
   * This one is a bit different from `files_capture` add.
   * It will need to first check if the url is already inserted in the db.
   * If not, insert it. 
   * If yes, increase the 
   * ------------
   * Params:
    {
      data: [],
      do_static_check: bool
    }
   * Need `do_static_check` because the python script to capture and extract urls might already run static check
   * 
   * ****************************/
  module.addMany = async function (req, res) {
    var capture_datas = req.body.data

    var do_static_check = req.body.do_static_check || false

    var errAr = []
    var captureJsons = []
    await Promise.all(capture_datas.map(async capture_data => {
      var captureJson = url_capture_builder(capture_data)

      if (captureJson == null) {
        errAr.push('Can\'t build record')
      } 
      else {
        if (do_static_check) {
          captureJson = await detectors.static4url(capture_data.url_path, captureJson)
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
