const { ObjectId } = require('mongodb') // or ObjectID 

function getMongoDecNum(value) {
  if (typeof value !== 'undefined') {
    return parseFloat(value.toString())
  }
  return value
}

var self = module.exports = {

  db: null,
  collection_name: null,


  /* ****************************
   * 
   * Query a specific record by id
   * 
   * ****************************/
  getById: async function (req, res) {
    if (!req.body.hasOwnProperty('_id') || req.body._id == null || typeof req.body._id !== 'string' || req.body._id.length === 0) {
      return res.status(505).send({
        status: 'error',
        message: 'id must be provided'
      })
    }

    const id = req.body._id

    const TheCollection = self.db.collection(self.collection_name)
    const item = await TheCollection.findOne({
      _id: ObjectId(id),
    })

    return res.send({
      status: 'success',
      data: item
    })
  },


  /* ****************************
   * 
   * Query a specific record by query
   * 
   * ****************************/
  getByQuery: async function (req, res, query) {
    const TheCollection = self.db.collection(self.collection_name)
    const item = await TheCollection.findOne(query)

    return res.send({
      status: 'success',
      data: item
    })
  },


  /* ****************************
   * 
   * Query a specific record by agrgegation query
   * 
   * ****************************/
  getByAggQuery: async function (req, res, aggAr) {
    const TheCollection = self.db.collection(self.collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    var data = null
    if (items.length > 0) {
      data = items[0]
    }

    return res.send({
      status: 'success',
      data: data
    })
  },


  /* ****************************
   * 
   * Retrieve a list of records using filter
   * 
   * ****************************/
  getListAdvanced: async function (res, filter, aggQ, page, num_per_page, do_count) {
    var aggAr = []

    if (filter != null && filter.hasOwnProperty('aggMatchQ') && filter.aggAr) {
      aggAr = filter.aggMatchQ
    }
    else {
      var matchAr = []
      for (const [k, v] of Object.entries(filter)) {
        console.log(k, v)
        if (v != null && v.length > 0) {
          matchAr.push({ [k]: { $eq: v } })
        }
      }
      // console.log('matchAr', matchAr)

      if (matchAr.length > 0) {
        aggAr.push({
          $match: {
            $and: matchAr
          }
        })
      }
    }

    aggAr = [...aggAr, ...aggQ]

    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    const TheCollection = self.db.collection(self.collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  },


  /* ****************************
   * 
   * Retrieve a list of records using aggregation array
   * 
   * ****************************/
  aggregateList: async function (res, aggAr) {
    const TheCollection = self.db.collection(self.collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items,
    })
  },


  /* ****************************
   * 
   * Retrieve a list of records using filter
   * 
   * ****************************/
  getList: async function (res, filter, page, num_per_page, do_count) {
    var aggAr = []

    if (filter != null && filter.hasOwnProperty('aggMatchQ') && filter.aggAr) {
      aggAr = filter.aggMatchQ
    }
    else {
      var matchAr = []
      for (const [k, v] of Object.entries(filter)) {
        console.log(k, v)
        if (v != null && v.length > 0) {
          matchAr.push({ [k]: { $eq: v } })
        }
      }
      // console.log('matchAr', matchAr)

      if (matchAr.length > 0) {
        aggAr.push({
          $match: {
            $and: matchAr
          }
        })
      }
    }

    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    const TheCollection = self.db.collection(self.collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  },


  /* ****************************
   * 
   * Retrieve a list of records using filter
   * 
   * ****************************/
  getListAdvanced: async function (res, filter, aggQ, page, num_per_page, do_count) {
    var aggAr = []

    if (filter != null && filter.hasOwnProperty('aggMatchQ') && filter.aggAr) {
      aggAr = filter.aggMatchQ
    }
    else {
      var matchAr = []
      for (const [k, v] of Object.entries(filter)) {
        console.log(k, v)
        if (v != null && v.length > 0) {
          matchAr.push({ [k]: { $eq: v } })
        }
      }
      // console.log('matchAr', matchAr)

      if (matchAr.length > 0) {
        aggAr.push({
          $match: {
            $and: matchAr
          }
        })
      }
    }

    aggAr = [...aggAr, ...aggQ]

    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    const TheCollection = self.db.collection(self.collection_name)
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  },


  /* ****************************
   * 
   * Insert a record
   * 
   * ****************************/
  insertOne: async function (req, res, insert_data) {
    if (insert_data == null) {
      return res.status(505).send({
        status: 'error',
        message: 'Missing data to build record'
      })
    }

    const loggedUser = req.user
    insert_data.uid_inserted = ObjectId(loggedUser.id)

    const dt = dateTime.create()
    insert_data.time_inserted = insert_data.time_last_modified = dt.format('Y-m-d H:M:S')

    const TheCollection = self.db.collection(self.collection_name)
    try {
      const inserted_data = await TheCollection.insertOne(insert_data, { safe: true })
      // console.log('Success: ' + JSON.stringify(result))
      return res.send({
        status: 'success',
        data: insert_data
      })
    }
    catch (error) {
      return res.status(500).send({
        status: 'error',
        message: JSON.stringify(error)
      })
    }
  },


  /* ****************************
   * 
   * Insert mmultiple records
   * 
   * ****************************/
  insertMany: async function (req, res, insert_datas) {
    const loggedUser = req.user
    const dt = dateTime.create()

    const insertJsons = await Promise.all(insert_datas.map(async insert_data => {
      insert_data.uid_inserted = ObjectId(loggedUser.id)
      insert_data.time_inserted = insert_data.time_last_modified = dt.format('Y-m-d H:M:S')
      return insert_data
    }))

    console.log('insertJsons', insertJsons)

    const TheCollection = self.db.collection(self.collection_name)
    try {
      /*
       * With ordered to false, the insert operation would continue with any remaining documents.
       * Otherwise, failed attempt to insert a document will stop additional documents left in the queue from being inserted.
       */
      const inserted_datas = await TheCollection.insertMany(insertJsons, { ordered: false })
      // console.log('Success: ' + JSON.stringify(result))
      return res.send({
        status: 'success',
        data: insertJsons
      })
    }
    catch (error) {
      return res.status(500).send({
        status: 'error',
        message: JSON.stringify(error)
      })
    }
  },


  /* ****************************
   * 
   * Update a record
   * 
   * ****************************/
  updateOne: async function (req, res, update_data, search_query) {
    /* 
     * Get data from request, inside the data has the _id key.
     * Use this key to query for the record that needs updating.
     */
    var data = req.body
    // if (!data.hasOwnProperty('_id') || data._id == null || data._id.length === 0) {
    //   return res.send({
    //     status: 'error',
    //     message: 'no _id provided'
    //   })
    // }

    /*
     * What to update ?
     */
    if (data.hasOwnProperty('_id') && data._id != null && data._id.length > 0) {
      const id = ObjectId(data._id)
      console.log('Updating data: ' + id)

      if (search_query == null) {
        search_query = { _id: id }
      } else {
        search_query = { 
          ...search_query,
          _id: id
        }  
      }
    }

    /*
     * The `update_data` is built using the `record_builder` modules,
     * thence sit will NOT include such fields as `_id`, `uid_inserted`, `uid_last_modified`...
     */
    // delete update_data['_id']

    /*
     * Insert some fields 
     */
    const loggedUser = req.user
    update_data.uid_last_modified = ObjectId(loggedUser.id)

    const dt = dateTime.create()
    update_data.time_last_modified = dt.format('Y-m-d H:M:S')

    /* 
     * Okay update db
     */
    const TheCollection = self.db.collection(self.collection_name)
    try {
      await TheCollection.updateOne(search_query, {
        $set: update_data
      })

      return res.send({
        status: 'success',
        data: update_data
      })
    }
    catch (error) {
      // console.log('~error', error)
      return res.status(500).send({
        status: 'error',
        message: JSON.stringify(error)
      })
    }
  },


  /* ****************************
   * 
   * Delete by id
   * 
   * ****************************/
  deleteById: async function (req, res) {
    var data = req.body
    if (!data.hasOwnProperty('_id')) {
      return res.status(403).send({
        status: 'error',
        message: 'no _id provided'
      })
    }

    const id = ObjectId(data._id)
    console.log('Deleting data: ' + id)

    const TheCollection = self.db.collection(this.collection_name)

    try {
      const result = await TheCollection.remove({
        _id: ObjectId(id),
      }, { safe: true })

      return res.send({
        status: 'success',
      })
    }
    catch (error) {
      return res.status(403).send({
        status: 'error',
        message: JSON.stringify(error)
      })
    }
  },


  updateModuleSttById: async function (module_id, running_stt) {
    if (module_id == null || module_id.length === 0) {
      return false
    }

    module_id = ObjectId(module_id)

    const TheCollection = self.db.collection('modules')
    try {
      await TheCollection.updateOne({
        _id: module_id
      }, {
        $set: {
          running: running_stt
        }
      })
      return true
    }
    catch (error) {
      // console.log('~error', error)
      return false
    }
  },

  updateModuleSttByCode: async function (module_code, running_stt) {
    if (module_code == null || module_code.length === 0) {
      return false
    }

    const TheCollection = self.db.collection('modules')
    try {
      await TheCollection.updateOne({
        code: { $eq: module_code }
      }, {
        $set: {
          running: running_stt
        }
      })
      return true
    }
    catch (error) {
      // console.log('~error', error)
      return false
    }
  },

  addModuleRun: async function (file_paths, module_code, tbls) {
    if (file_paths == null || !Array.isArray(file_paths) || file_paths.length === 0 || module_code == null || module_code.length === 0) {
      return false
    }

    if (tbls == null || !Array.isArray(tbls) || tbls.length === 0) {
      tbls = ['files_capture', 'urls_capture', 'files_upload', 'urls_upload']
    }

    for (const tbl in tbls) {
      const TheCollection = self.db.collection(tbl)
      try {
        await TheCollection.update({
          file_path: { $in: file_paths }
        }, {
          $addToSet: { modules_run: module_code }
        })
        return true
      }
      catch (error) {
        // console.log('~error', error)
        return false
      }
    }
  },

  setModuleVerifiedByCode: async function (verified, module_code) {
    const TheCollection = self.db.collection('modules')
    try {
      await TheCollection.updateOne({
        code: { $eq: module_code }
      }, {
        $set: {
          verified: verified
        }
      })
      return true
    }
    catch (error) {
      // console.log('~error', error)
      return false
    }
  }

}
