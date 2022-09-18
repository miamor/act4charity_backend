const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const { charity_act_builder } = require('../../record_builder/charity_act_builder')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'charity_acts'


  /* ****************************
   * 
   * Add a record
   * ------------
   * Params:
    {
      ... // data here
    }
   * 
   * ****************************/
  module.addOne = async function (req, res) {
    var capture_data = req.body

    captureJson = charity_act_builder(capture_data)

    if (captureJson == null) {
      return res.send({
        status: 'error',
        message: 'Missing data to build record'
      })
    }

    querier.insertOne(req, res, captureJson)
  }


  /* ****************************
 * 
 * Update a record
 * 
 * ****************************/
  module.update = async function (req, res) {
    const captureJson = charity_act_builder(req.body)

    return querier.updateOne(req, res, captureJson)
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
