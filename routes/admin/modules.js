const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const { module_builder } = require('../../record_builder/module_builder')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'modules'


  /* ****************************
   * 
   * Verify/Unverify a module
   * 
   * ****************************/
  module.verify = async function (req, res) {
    const verified = req.body.verified || false
    const module_code = req.body.module_code || null

    if (module_code == null) {
      res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    const isUpdate = querier.setModuleVerifiedByCode(verified, module_code)

    if (isUpdate) {
      return res.send({
        status: 'success'
      })
    }

    return res.send({
      status: 'error',
      message: 'Can\'t update module'
    })
  }

  
  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  module.update = async function (req, res) {
    const moduleJson = module_builder(req.body)

    return querier.updateOne(req, res, moduleJson)
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