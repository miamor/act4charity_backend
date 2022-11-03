const bcrypt = require('bcryptjs')
const { ObjectId } = require('mongodb') // or ObjectID 

module.exports = function (db) {
  var module = {}


  module.register = async function (req, res) {
    const user_info = req.body
    const password = user_info.password
    const external_login = user_info.external_login || false

    console.log('[register] user_info', checkUserEmail)

    const UsersCollection = db.collection('users')
    var checkUserEmail = await UsersCollection.findOne({ email: user_info.email })
    console.log('checkUserEmail', checkUserEmail)
    if (checkUserEmail != null) {
      return res.status(505).send({
        status: 'error',
        message: 'This email has been registered.'
      })
    }

    const checkUsername = await UsersCollection.findOne({ username: user_info.username })
    if (checkUsername != null) {
      return res.status(505).send({
        status: 'error',
        message: 'Username not available.'
      })
    }

    if (external_login == true) {
      const inserted_data = await UsersCollection.insertOne({
        email: user_info.email,
        username: user_info.username,
        // password: hashedPassword,
        type: 'user',
        // premium: 0,
        current_reward: 5,
        current_donation: 0,
        avatar: 'https://socking.act4charity.monster/logo.png',
        firstname: user_info.firstname,
        interests: [],
        external_login: true,
      })

      return res.send({
        status: 'success',
        // data: inserted_data,
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
            return res.status(505).send({
              status: 'error',
              message: 'Cannot encrypt.'
            })
          }

          hashedPassword = hash
          console.log(hash)

          const inserted_data = await UsersCollection.insertOne({
            email: user_info.email,
            username: user_info.username,
            password: hashedPassword,
            type: 'user',
            // premium: 0,
            current_reward: 5,
            current_donation: 0,
            avatar: 'https://socking.act4charity.monster/logo.png',
            firstname: user_info.firstname,
            interests: [],
            external_login: false,
          })

          return res.send({
            status: 'success',
            data: {
              status: 'success',
              // data: inserted_data
            }
          })
        })
      })

    }
    catch (err) {
      return res.status(500).send({
        status: 'error',
        message: 'An error has occurred'
      })
    }
  }


  module.login = async function (req, res) {
    const user_info = req.body
    const password = user_info.password
    const external_login = user_info.external_login || false

    console.log('Login as: ' + JSON.stringify(user_info))

    const UsersCollection = db.collection('users')

    // try {
    var user = await UsersCollection.findOne({ username: user_info.username })

    console.log('Success: ' + JSON.stringify(user))
    //var token = crypto.randomBytes(64).toString('hex')
    //response = {token: }

    if (external_login == true) {
      const payload = {
        id: user._id,
        username: user.username,
        type: user.type
      }
      console.log('>> (external_login) login payload', payload)
      
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


    bcrypt.genSalt(10, function (err, Salt) {
      bcrypt.hash(password, Salt, async function (err, hash) {
        console.log('hash : ', hash)
      })
    })

    if (!user) {
      return res.status(505).send({
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
          const token = jwt.sign(payload, app.get('superSecret'))

          const response = {
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
          return res.status(401).send({
            status: 'error',
            message: 'Authentication failed. User not found.'
          })
        }
      })

    }
  }

  return module
}