const querier = require('../../modules/querier')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'traffic_capture'


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


  return module
}
