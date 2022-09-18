const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')
const { user_builder } = require('../../record_builder/user_builder')

module.exports = function (db) {
  var module = {}

  module.getMyInfo = function (req, res) {
    var token = req.headers['Authorization'] || req.headers['authorization']

    if (token) {
      // verifies secret and checks exp
      jwt.verify(token, app.get('superSecret'), function (err, decoded) {
        if (err) {
          return res.send({ status: 'error', message: 'Failed to authenticate token.' })
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded
          console.log(decoded)
          // get user info here
          db.collection('users', function (err, collection) {
            collection.findOne({ username: decoded.username }, function (err, item) {
              delete item['_id']
              delete item['password']
              console.log('Got my info: ')
              console.log(JSON.stringify(item))
              return res.send(item)
            })
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

  module.update = async function (req, res) {
    // var users = req.body
    // users.username = loggedUser.username
    // users.type = loggedUser.type
    // delete users._id

    const userJson = user_builder(req.body)

    return querier.updateOne(req, res, userJson, {_id: ObjectId(loggedUser.id)})
  }


  return module
}
