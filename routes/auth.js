const bcrypt = require('bcryptjs')
const { ObjectId } = require('mongodb') // or ObjectID 

module.exports = function (db) {
  var module = {}

  // Handling user signup
  module.register = async function (req, res) {
    const user_info = req.body
    const password = user_info.password
    console.log('[register] user_info', checkUserEmail)

    const UsersCollection = db.collection('users')
    var checkUserEmail = await UsersCollection.findOne({ email: user_info.email })
    console.log('checkUserEmail', checkUserEmail)
    if (checkUserEmail != null) {
      return res.send({
        status: 'error',
        message: 'This email has been registered.'
      })
    }

    const checkUsername = await UsersCollection.findOne({ username: user_info.username })
    if (checkUsername != null) {
      return res.send({
        status: 'error',
        message: 'Username not available.'
      })
    }

    // const interests = user_info.interests.map(x => ObjectId(x))

    try {
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
          console.log(hash)

          const user = await UsersCollection.insertOne({
            email: user_info.email,
            username: user_info.username,
            password: hashedPassword,
            type: 'user',
            // premium: 0,
            current_reward: 5,
            current_donation: 0,
            avatar: 'http://149.28.157.194:5006/logo.png',
            firstname: user_info.firstname,
            interests: [],
          })

          response = {
            status: 'success'
          }
          return res.send({
            status: 'success',
            data: response
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
  }


  module.login = async function (req, res) {
    const user_info = req.body
    const password = user_info.password

    console.log('Login as: ' + JSON.stringify(user_info))

    const UsersCollection = db.collection('users')

    // try {
    var user = await UsersCollection.findOne({ username: user_info.username })

    console.log('Success: ' + JSON.stringify(user))
    //var token = crypto.randomBytes(64).toString('hex')
    //response = {token: }

    bcrypt.genSalt(10, function (err, Salt) {
      bcrypt.hash(password, Salt, async function (err, hash) {
        console.log('hash : ', hash)
      })
    })

    if (!user) {
      return res.send({
        status: 'error',
        message: 'Authentication failed. User not found.'
      })
    } else if (user) {
      console.log(' >> user.password', user.password)

      bcrypt.compare(password, user.password, async function (err, isMatch) {
        // Comparing the original password to
        // encrypted password   
        if (isMatch) {
          const payload = {
            id: user._id,
            username: user.username,
            //password: user.password,
            type: user.type
          }
          console.log('>> login payload', payload)
          /*var token = jwt.sign(payload, app.get('superSecret'), {
            expiresInMinutes: 1440 // expires in 24 hours
          })*/
          var token = jwt.sign(payload, app.get('superSecret'))

          response = {
            status: 'success',
            message: 'Enjoy your token!',
            uType: user.type,
            token: token,
            user_info: user,
          }
          return res.send({
            status: 'success',
            data: response
          })
        }

        if (!isMatch) {
          // If password doesn't match the following
          // message will be sent
          return res.send({
            status: 'error',
            message: 'Authentication failed. User not found.'
          })
        }
      })

    }
  }

  return module
}