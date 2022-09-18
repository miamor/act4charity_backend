const uploader = require('../../modules/uploader')
const querier = require('../../modules/querier')
const traffic_converter = require('../../modules/traffic_converter')
const noti_handler = require('../../modules/noti_handler')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'traffic_upload'
  noti_handler.db = db


  /* ****************************
   * 
   * Query a specific record 
   * 
   * ****************************/
  module.getByPath = async function (req, res) {
    if (!req.body.hasOwnProperty('pcap_file') || req.body.pcap_file == null || typeof req.body.pcap_file !== 'string' || req.body.pcap_file.length === 0) {
      return res.send({
        status: 'error',
        message: 'id must be provided'
      })
    }

    const path_to_pcap = req.body.pcap_file

    return querier.getByQuery(req, res, { from_file: path_to_pcap })
  }


  /* ****************************
   * 
   * Upload files
   * When a user upload a pcap file, convert it to csv, then convert to json, then insert to db
   * 
   * ****************************/
  module.upload = async function (req, res) {
    /*
     * first upload files
     */
    var upload_res = uploader.uploadFile(req, res, ['PCAP'])
    if (upload_res.status === 'error') {
      return res.send({
        status: 'error',
        message: upload_res
      })
    }

    files_data = upload_res.data


    /* 
     * loop through uploaded files,
     * convert to json
     */
    var errAr = []
    var uploadJsons = []
    await Promise.all(files_data.map(async upload_data => {
      const pcap_path = upload_data.file_path
      
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
        errAr.push(`Fail to process ${pcap_path} : Can't build record`)
      }

      uploadJsons = [...uploadJsons, ...jsonArr]
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


  return module
}
