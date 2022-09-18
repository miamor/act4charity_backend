const { ObjectId } = require('mongodb') // or ObjectID 
const { charity_act_builder } = require('../../record_builder/charity_act_builder')
const querier = require('../../modules/querier')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'files_capture'


  /* ****************************
   * 
   * Stat by date
   * 
   * ****************************/
  module.historyAnalyzeByDate = async function (req, res) {
    var dt = dateTime.create()
    // const time = dt.format('Y-m-d H:M:S')
    const time_start = dt.setHours(0,0,0,0).format('Y-m-d H:M:S')
    const time_end = dt.setHours(24,0,0,0).format('Y-m-d H:M:S')

    matchAr = {
      $and: [{
        time_inserted: {
          $gte: time_start,
          $lt: time_end
        }
      }]
    }
    aggAr = [{
      $match: matchAr
    }]

    return querier.getById(req, res)
  }


  return module
}
