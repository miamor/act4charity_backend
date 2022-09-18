const querier = require('../../modules/querier')
const traffic_converter = require('../../modules/traffic_converter')
const noti_handler = require('../../modules/noti_handler')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'traffic_capture'
  noti_handler.db = db


  /* ****************************
   * 
   * Add multiple records
   * ------------
   * Params:
    {
      pcap_paths: []
    }
   * 
   * ****************************/
  module.addByPcaps = async function (req, res) {
    if (!req.body.hasOwnProperty('pcap_paths') || req.body.pcap_paths == null || !Array.isArray(req.body.pcap_paths) || req.body.pcap_paths.length === 0) {
      return res.send({
        status: 'error',
        message: 'pcap_paths must be provided'
      })
    }

    const pcap_paths = req.body.pcap_paths

    var errAr = []
    var captureJsons = []
    await Promise.all(pcap_paths.map(async pcap_path => {
      /*
       * Convert pcap to csv
       */
      //! change the path plzzz
      const csvOutDir = '/home/ubuntu/Documents/SMaD/data/uploaded_traffic_csv'
      var csv_path = null
      csv_path = await traffic_converter.pcap2csv(pcap_path, csvOutDir, csv_path)
      console.log('\t >> run pcap2csv done ')

      /*
       * Convert csv to json
       */
      var jsonArr = []
      jsonArr = await traffic_converter.csv2json(csv_path, jsonArr, pcap_path)

      if (jsonArr.length === 0) {
        errAr.push(`Fail to process ${csv_path} : Can't build record`)
      }

      captureJsons = [...captureJsons, ...jsonArr]
    }))

    console.log('>> captureJsons.length', captureJsons.length)


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


  /* ****************************
   * 
   * Add multiple records
   * ------------
   * Params:
    {
      csv_paths: []
    }
   * 
   * ****************************/
  module.addByCsvs = async function (req, res) {
    if (!req.body.hasOwnProperty('csv_paths') || req.body.csv_paths == null || !Array.isArray(req.body.csv_paths) || req.body.csv_paths.length === 0) {
      return res.send({
        status: 'error',
        message: 'csv_paths must be provided'
      })
    }

    const csv_paths = req.body.csv_paths

    var errAr = []
    var captureJsons = []
    await Promise.all(csv_paths.map(async csv_path => {
      /*
       * Convert csv to json
       */
      var jsonArr = []
      jsonArr = await traffic_converter.csv2json(csv_path, jsonArr, null)

      if (jsonArr.length === 0) {
        errAr.push(`Fail to process ${csv_path} : Can't build record`)
      }

      captureJsons = [...captureJsons, ...jsonArr]

      console.log('\njsonArr', jsonArr.length)
      console.log('captureJsons.length', captureJsons.length)
    }))

    console.log('>> captureJsons.length', captureJsons.length)
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