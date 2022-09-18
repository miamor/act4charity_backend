const { ObjectId } = require('mongodb') // or ObjectID 
const { history_analyze_builder } = require('../../record_builder/history_analyze_builder')
const querier = require('../../modules/querier')
const noti_handler = require('../../modules/noti_handler')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'history_analyze'
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
      module: string (module _id)
    }
   * 
   * ****************************/
  module.addOne = async function (req, res) {
    var analyze_data = req.body

    analyzeJson = history_analyze_builder(analyze_data)

    // console.log('Adding analyze_data : ' + JSON.stringify(analyzeJson))

    return querier.insertOne(req, res, analyzeJson)
  }


  /* ****************************
   * 
   * Add multiple records
   * ----
   * Use this api when want to insert a batch of analyzed data
   * Usually a module will process a batch of files, after finishing it will send back also a batch of analyzed results.
   * ------------
   * Params:
    {
      result: dict,
      note: dict | str,
      next_modules_sent: array | dict | ''
    }
   * 
   * ****************************/
  module.addMany = async function (req, res) {
    if (!req.body.hasOwnProperty('result') || req.body.result == null) {
      return res.send({
        status: 'error',
        message: 'Missing field'
      })
    }

    var result = req.body.result,
      note = req.body.note,
      next_modules_sent = req.body.next_modules_sent
    var paths = Object.keys(result)


    // var module_id = req.body.module_id
    const module_code = req.user.username //? module_code is the username of the request user

    /*
     * Update module status first
     * Let the collector know it's hungry again
     */
    await querier.updateModuleSttByCode(module_code, false)


    /*
     * Update the entity's `modules_run` field, so that the collector knows these entities (files/urls) have been analyzed by these module
     * Update by filepath
     */
    if (Array.isArray(next_modules_sent) && next_modules_sent.length > 0) {
      await Promise.all(next_modules_sent.map(async next_mod => {
        await querier.addModuleRun(paths, next_mod.code)
      }))
    }


    /*
     * Now construct the record to insert to database
     */
    var errAr = []
    var analyzeJsons = []
    await Promise.all(paths.map(path => {
      var analyzeJson = {
        path: path
      }

      //? what type of module is this. if it's a `detector`, then `result` dict values will be boolean of detection result
      //? simple check, module_code always has prefix. `det_` for detector, `prp_` for processor, `sbx_` for sandbox
      if (path.substring(0, 3) === 'det_') {
        analyzeJson.detected = result[path]
      }

      if (typeof note === 'string') {
        analyzeJson.note = note
      } else {
        if (note.hasOwnProperty(path) && note[path] != null) {
          analyzeJson.note = note[path]
        }
      }

      analyzeJsons.push(analyzeJson)
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
    return querier.insertMany(req, res, analyzeJsons)
  }


  return module
}
