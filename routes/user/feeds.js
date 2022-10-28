const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const uploader = require('../../modules/uploader')


module.exports = function (db) {
  var module = {}

  querier.db = db
  const collection_name = 'feeds' //! change this


  /* ****************************
   * 
   * Query a specific record by id
   * 
   * ****************************/
  module.getById = async function (req, res) {
    querier.collection_name = collection_name
    
    return querier.getById(req, res)
  }


  /* ****************************
   * 
   * Retrieve a list of records
   * ----
   * Params:
      {
        "filter": {
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
    querier.collection_name = collection_name
    
    var params = req.body
    // console.log('params', params)

    if (!params.hasOwnProperty('filter') || !params.hasOwnProperty('page') || !params.hasOwnProperty('num_per_page') || !params.hasOwnProperty('do_count')) {
      return res.status(505).send({
        status: 'error',
        message: 'Missing params'
      })
    }

    var filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    return querier.getList(res, filter, page, num_per_page, do_count)
  }


  /* ****************************
   * 
   * Share completed screenshot to feed
   * 
   * ****************************/
  module.share = async function (req, res) {
    //? challenge_id
    const challenge_id = ObjectId(req.body.challenge_id)
    //? challenge_accepted_id
    const challenge_accepted_id = ObjectId(req.body.challenge_accepted_id)
    //? user id
    const user_id = ObjectId(req.user.id)

    const public = req.body.public === "false" ? false : true

    /*
     * first upload files
     */
    var upload_res = uploader.uploadFiles(req, res)
    if (upload_res.status === 'error') {
      return res.status(505).send({
        status: 'error',
        message: upload_res
      })
    }

    files_data = upload_res.data


    /* 
     * Get path to the uploaded file
     */
    const filepath = files_data[0].file_path
    const file_urlpath = 'https://socking.act4charity.monster/' + filepath.split('/uploads/')[1]


    /*
     * Add to db
     */
    let insert_data = {
      picture: file_urlpath,
      content: req.body.content,
      challenge_accepted: challenge_accepted_id,
      challenge: challenge_id,
      user: user_id,
      public: public
    }
    const TheCollection = db.collection(collection_name)
    const inserted_data = await TheCollection.insertOne(insert_data, { safe: true })


    return res.send({
      status: 'success',
      data: {
        ...insert_data,
        _id: inserted_data.insertedId
      }
    })
  }


  return module
}
