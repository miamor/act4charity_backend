const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const uploader = require('../../modules/uploader')
const { user_builder } = require('../../record_builder/user_builder')

module.exports = function (db) {
  var module = {}

  const collection_name = 'users' //! change this


  /* ****************************
   * 
   * Get my info
   * 
   * ****************************/
  module.getMyInfo = async function (req, res) {
    var token = req.headers['Authorization'] || req.headers['authorization']

    if (token) {
      // verifies secret and checks exp
      return jwt.verify(token, app.get('superSecret'), async function (err, decoded) {
        if (err) {
          return res.send({ status: 'error', message: 'Failed to authenticate token.' })
        } else {
          //? if everything is good, save to request for use in other routes
          req.decoded = decoded
          console.log(decoded)

          const TheCollection = db.collection(collection_name)
          const item = await TheCollection.findOne({ username: decoded.username })
          delete item['password']

          console.log('Got my info: ')
          console.log(JSON.stringify(item))
          return res.send({
            status: 'success',
            data: item
          })
        }
      })
    } else {

      // if there is no token
      // return an error
      return res.status(403).send({
        status: 'error',
        message: 'No token provided.'
      })

    }
  }


  /* ****************************
   * 
   * Update my info
   * 
   * ****************************/
  module.update = async function (req, res) {
    querier.collection_name = collection_name

    const loggedUser = req.user

    console.log(loggedUser)

    // var users = req.body
    // users.username = loggedUser.username
    // users.type = loggedUser.type
    // delete users._id

    // const userJson = user_builder(req.body)
    let userJson = req.body
    if (userJson.interests != null) {
      console.log('userJson.interests', userJson.interests)
      userJson.interests = userJson.interests.map(x => ObjectId(x))
    }
    delete userJson._id
    delete userJson.username
    delete userJson.password
    delete userJson.email

    return querier.updateOne(req, res, userJson, { _id: ObjectId(loggedUser.id) })
  }


  /* ****************************
   * 
   * Upload and update profile picture
   * 
   * ****************************/
  module.uploadAvt = async function (req, res) {
    querier.collection_name = collection_name

    const loggedUser = req.user

    /*
     * first upload files
     */
    console.log('calling uploader.uploadFiles ~~~~~~~~~')
    var upload_res = uploader.uploadFiles(req, res)
    console.log('upload_res =', upload_res)
    if (upload_res.status === 'error') {
      return res.send(upload_res)
    }

    files_data = upload_res.data


    /* 
     * Get path to the uploaded file
     */
    // const filepaths = files_data.map(file_data => file_data.file_path)
    const filepath = files_data[0].file_path

    const file_urlpath = 'http://149.28.157.194:5006/'+filepath.split('/uploads/')[1]


    /* 
     * Update database
     */
    return querier.updateOne(req, res, { avatar: file_urlpath }, { _id: ObjectId(loggedUser.id) })
  }


  return module
}
