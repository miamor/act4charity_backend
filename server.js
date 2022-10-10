const port = 5005
const SECRET_KEY = 'asimplekey'
const DB_HOST = '149.28.157.194'
const DB_PORT = '27017'
const DB_USERNAME = 'admin_a4c'
const DB_PASSWORD = 'a4c%40comp18%2322'//'a4c@comp18#22'
const DB_NAME = 'act4charity'
const DB_AUTH_MECSM = 'DEFAULT'
const DB_AUTH_SOURCE = 'perm'

var mongo_connect_url = `mongodb://${DB_HOST}:${DB_PORT}`
if (DB_USERNAME.length > 0 && DB_PASSWORD.length > 0) {
  mongo_connect_url = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/?authMechanism=${DB_AUTH_MECSM}&authSource=${DB_AUTH_SOURCE}`
}
// console.log(mongo_connect_url)

/*
 * My life depends on you
 */
express = require('express'), jwt = require('jsonwebtoken'), expressJWT = require('express-jwt'), ObjectID = require("bson-objectid"), dateTime = require('node-datetime')
const cors = require('cors')
// var mongo = require('mongodb')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const { MongoClient } = require('mongodb')

app = express()
app.set('superSecret', SECRET_KEY)


/*
 * Use some middlewares
 */
app.use(fileUpload({
  createParentPath: true
}))
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


/* 
 * Config server & token 
 */
JWT_CONFIG = expressJWT({
  secret: app.get('superSecret'), // Use the same token that we used to sign the JWT above
  algorithms: ['HS256'],
  // Let's allow our clients to provide the token in a variety of ways
  getToken: function (req, res) {
    if (req.headers.authorization) { // Authorization: g1jipjgi1ifjioj
      // var token = req.headers.authorization
      var token = req.headers['Authorization'] || req.headers['authorization']

      if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
          if (err) {
            console.log('jwt err', err)
            // return res.send({ status: 'error', message: 'Failed to authenticate token.' })
          } else {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded
          }
        })
      }

      return req.headers.authorization
    } else {
      //res.sendStatus(401)
    }
    //? If we return null, we couldn't find a token.
    //? In this case, the JWT middleware will return a 401 (unauthorized) to the client for this request
    // return null
    res.sendStatus(401)
  }
}).unless({
  path: [
    /^(?!(\/(admin|user|sponsor)).*$).*/
  ]
})

app.use(JWT_CONFIG)


/*
 * Authorization check (role-based check)
 * Morality structure haha
 */
function checkRole(roles) {
  // console.log('roles', roles)
  return function (req, res, next) {
    // console.log(req.headers)
    // console.log('>>> req.user', req.user)
    
    if (roles.indexOf(req.user.type) > -1) {
      next()
    } else {
      return res.status(403).send({
        status: 'error',
        message: 'Insufficient permissions'
      })
    }
  }
}

app.use(JWT_CONFIG)

/*
 * Setup permission middleware
 */
app.use(/\/user/, checkRole(["user", "admin"]))
app.use(/\/sponsor/, checkRole(["sponsor", "admin"]))
app.use(/\/admin/, checkRole(["admin"]))

/*
 * Handling permission errors.
 * Life lesson. Dont do what you must not do.
 */
app.use(function (err, req, res, next) {
  //console.log(req.headers)
  if (err.status === 403 || err.code === 'permission_denied') {
    return res.status(403).send({
      status: 'error',
      message: 'Insufficient permissions'
    })
  } else if (err.status === 401) {
    return res.status(401).send({
      status: 'error',
      message: err.message
    })
  } else if (err.status === 404) {
    return res.status(404).send({
      status: 'error',
      message: 'No method.'
    })
  }
})



/*
 * Let's host some services
 */
MongoClient.connect(mongo_connect_url).then(client => {
  const db = client.db(DB_NAME)

  console.log("Connected to database")

  app.disable('etag')


  /* ****************************
   * 
   * Auth
   * 
   * ****************************/
  var AUTH = require('./routes/auth'),
    auth = new AUTH(db)
  app.post('/auth/login', auth.login)
  app.post('/auth/register', auth.register)



  /* ****************************
   * 
   * Admin routes 
   * 
   * ****************************/
  // var AD_USERS = require('./routes/admin/users'),
  //   ad_users = new AD_USERS(db)
  // app.post('/admin/users/list', ad_users.getList)
  // app.post('/admin/users/detail', ad_users.getById)
  // app.post('/admin/users/add', ad_users.add)
  // app.post('/admin/users/update', ad_users.update)
  // app.post('/admin/users/delete', ad_users.delete)

  // var AD_CHARITY_ACT = require('./routes/admin/charity_acts'),
  //   ad_charity_act = new AD_CHARITY_ACT(db)
  // app.post('/admin/charity_act/list', ad_charity_act.getList)
  // app.post('/admin/charity_act/detail', ad_charity_act.getById)
  // app.post('/admin/charity_act/add', ad_charity_act.add)
  // app.post('/admin/charity_act/update', ad_charity_act.update)
  // app.post('/admin/charity_act/delete', ad_charity_act.delete)

  // var AD_CHARITY_ORG = require('./routes/admin/charity_orgs'),
  //   ad_charity_org = new AD_CHARITY_ORG(db)
  // app.post('/admin/charity_org/list', ad_charity_org.getList)
  // app.post('/admin/charity_org/detail', ad_charity_org.getById)
  // app.post('/admin/charity_org/add', ad_charity_org.add)
  // app.post('/admin/charity_org/update', ad_charity_org.update)
  // app.post('/admin/charity_org/delete', ad_charity_org.delete)

  // var AD_CHALLENGE = require('./routes/admin/challenges'),
  //   ad_challenge = new AD_CHALLENGE(db)
  // app.post('/admin/challenge/list', ad_challenge.getList)
  // app.post('/admin/challenge/detail', ad_challenge.getById)
  // app.post('/admin/challenge/add', ad_challenge.add)
  // app.post('/admin/challenge/update', ad_challenge.update)
  // app.post('/admin/challenge/delete', ad_challenge.delete)



  /* ****************************
   * 
   * Sponsor routes 
   * 
   * ****************************/
  // var SPON_CHALLENGE = require('./routes/sponsor/challenges'),
  //   spon_challenge = new SPON_CHALLENGE(db)
  // app.post('/sponsor/challenge/donate', spon_challenge.donate)




  /* ****************************
   * 
   * User routes 
   * 
   * ****************************/
  var US_ME_INFO = require('./routes/user/me'),
    us_me_info = new US_ME_INFO(db)
  app.post('/user/me/info', us_me_info.getMyInfo)
  app.post('/user/me/update', us_me_info.update)
  app.post('/user/me/uploadAvt', us_me_info.uploadAvt)

  var US_CHALLENGE = require('./routes/user/challenges'),
    us_challenges = new US_CHALLENGE(db)
  app.post('/user/challenges/list', us_challenges.getList) //? list by user preference
  app.post('/user/challenges/detail', us_challenges.getById)
  app.post('/user/challenges/join', us_challenges.joinById)
  app.post('/user/challenges/completed', us_challenges.getCompleted) //? my completed challenges



  /* ****************************
   * 
   * Everyone routes 
   * 
   * ****************************/
  var DATA = require('./routes/challenges'),
    challenges = new DATA(db)
  app.post('/challenges/list', challenges.getList)
  app.post('/challenges/detail', challenges.getById)
  app.post('/challenges/participants', challenges.getParticipants)

  var USERS = require('./routes/users'),
    users = new USERS(db)
  app.post('/users/list', users.getList)
  app.post('/users/detail', users.getById)

  var CHARITY_ACTS = require('./routes/charity_acts'),
    charity_acts = new CHARITY_ACTS(db)
  app.post('/charity_acts/list', charity_acts.getList)
  app.post('/charity_acts/detail', charity_acts.getById)

  var CHARITY_ORGS = require('./routes/charity_orgs'),
    charity_orgs = new CHARITY_ORGS(db)
  app.post('/charity_orgs/list', charity_orgs.getList)
  app.post('/charity_orgs/detail', charity_orgs.getById)

  var SPONSORS = require('./routes/sponsors'),
    sponsors = new SPONSORS(db)
  app.post('/sponsors/list', sponsors.getList)
  app.post('/sponsors/detail', sponsors.getById)


  /* 
   * Fire up the server
   */
  app.listen(port)
  console.log('Listening on port ' + port + '...')
})