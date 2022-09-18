const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const { module_builder } = require('../../record_builder/module_builder')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

module.exports = function (db) {
  var module = {}

  querier.db = db
  querier.collection_name = 'modules'


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
          "uid": string, 
          "type": string,
          "otype": string
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

    if (!filter.hasOwnProperty('uid') || !filter.hasOwnProperty('type') || !filter.hasOwnProperty('otype')) {
      return res.send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var uid = filter.uid,
      type = filter.type,
      otype = filter.otype

    /* 
     * Reconstruct filter 
     */
    //! TODO

    return querier.getList(res, filter, page, num_per_page, do_count)
  }


  /* ****************************
   * 
   * Add a record
   * 
   * ****************************/
  module.add = async function (req, res) {
    var moduleJson = module_builder(req.body)

    if (moduleJson == null) {
      return res.send({
        status: 'error',
        message: 'Missing data to build record'
      })
    }

    /*
     * Tricky part. 
     * When deploying a detection module, this module will always have to make some calls to the backend API.
     * All these requests should belong to the system's route.
     * So, when creating a module, we have to create a user of type system and link that account to this module.
     * Then in the module, login using module's id and secret key (which is used to set password for the linked account), then use the returned token for accessing API services.
     */
    //? first generate secret key
    secretkey = crypto.randomBytes(56).toString('base64')
    //? set the username
    username = `module_${moduleJson._id}`
    try {
      const UsersCollection = db.collection('users')
      // Encryption of the string password
      bcrypt.genSalt(10, function (err, Salt) {
        // The bcrypt is used for encrypting password.
        bcrypt.hash(password, Salt, async function (err, hash) {

          if (err) {
            // return console.log('Cannot encrypt')
            return res.send({
              status: 'error',
              message: 'Cannot encrypt.'
            })
          }

          hashedPassword = hash

          const user = await UsersCollection.insertOne({
            username: username,
            password: hashedPassword,
            type: 'system',
          })
        })
      })

    }
    catch (err) {
      return res.send({
        status: 'error',
        message: 'An error has occurred'
      })
    }


    /*
     * Because this request needs to return custom data, use the insert manually
     */
    // return querier.insertOne(req, res, moduleJson)
    const dt = dateTime.create()
    moduleJson.time_inserted = moduleJson.time_last_modified = dt.format('Y-m-d H:M:S')

    /*
     * Module requires `code` field to be unique.
     * Check if this `code` value found in db
     */

    const TheCollection = db.collection(querier.collection_name)
    try {
      const finds = await TheCollection.find({ code: moduleJson.code }).toArray()
      if (finds != null && finds.length > 0) {
        return res.send({
          status: 'error',
          message: 'This `code` is taken. Please choose another `code` for this module.'
        })
      }

      const inserted_data = await TheCollection.insertOne(moduleJson, { safe: true })

      /*
       * Return secret key
       * This will NOT be retrieved anywhere or anytime else
       */
      //! TODO: is it still insecured to do so ? Return password in raw format ?
      moduleJson.secretkey = secretkey

      /* 
       * Return data 
       */
      // console.log('Success: ' + JSON.stringify(result))
      return res.send({
        status: 'success',
        data: moduleJson
      })
    }
    catch (error) {
      return res.status(500).send({
        status: 'error',
        message: JSON.stringify(error)
      })
    }

  }


  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  module.update = async function (req, res) {
    const moduleJson = module_builder(req.body)

    return querier.updateOne(req, res, moduleJson, { _id: ObjectId(id), insert_uid: ObjectId(loggedUser.id) })
  }


  return module
}
