const bcrypt = require('bcryptjs')
const { ObjectId } = require('mongodb') // or ObjectID 

module.exports = function (db) {
  var module = {}

  // Handling user signup
  module.register = async function (req, res) {
    var users = req.body
    const password = users.password
    console.log('[register] users', checkUserEmail)

    const UsersCollection = db.collection('users')
    var checkUserEmail = await UsersCollection.findOne({ email: users.email })
    console.log('checkUserEmail', checkUserEmail)
    if (checkUserEmail != null) {
      return res.send({
        status: 'error',
        message: 'This email has been registered.'
      })
    }

    var checkUsername = await UsersCollection.findOne({ username: users.username })
    if (checkUsername != null) {
      return res.send({
        status: 'error',
        message: 'Username not available.'
      })
    }

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
            email: users.email,
            username: users.username,
            password: hashedPassword,
            type: 'user',
            // premium: 0,
            // point: 5,
            // bcoin: 10,
            // avatar: 'http://192.168.1.14/Asd7tr0Chy7481alkrt/avatar/c1.jpg',
            first_name: users.username
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
    var users = req.body
    const password = users.password

    console.log('Login as: ' + JSON.stringify(users))

    const UsersCollection = db.collection('users')

    // try {
    var user = await UsersCollection.findOne({ username: users.username })

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