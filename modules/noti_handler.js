const { ObjectId } = require('mongodb') // or ObjectID 

var self = module.exports = {

  db: null,
  collection_name: 'notifications',

  /* ****************************
  * 
  * Insert mmultiple notification records
  * 
  * ****************************/
  pushMsgs: async function (req, messages) {
    const loggedUser = req.user
    const dt = dateTime.create()

    const insertJsons = await Promise.all(messages.map(async msg => {
      var insert_data = {}
      insert_data.to_uid = ObjectId(loggedUser.id)
      insert_data.message = msg
      insert_data.time_inserted = insert_data.time_last_modified = dt.format('Y-m-d H:M:S')
      return insert_data
    }))

    console.log('insertJsons', insertJsons)

    const TheCollection = self.db.collection(self.collection_name)
    try {
      const inserted_datas = await TheCollection.insertMany(insertJsons, { safe: true })
      // console.log('Success: ' + JSON.stringify(result))
      return {
        status: 'success',
        data: insertJsons
      }
    }
    catch (error) {
      return {
        status: 'error',
        message: JSON.stringify(error)
      }
    }
  },

}