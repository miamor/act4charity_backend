const { ObjectId } = require('mongodb'); // or ObjectID 

function randomstring(L) {
  var s = '';
  var randomchar = function () {
    var n = Math.floor(Math.random() * 62);
    if (n < 10) return n; //1-10
    if (n < 36) return String.fromCharCode(n + 55); //A-Z
    return String.fromCharCode(n + 61); //a-z
  }
  while (s.length < L) s += randomchar();
  return s;
}

module.exports = function (db) {
  var module = {};

  module.findById = async function (req, res) {
    const loggedUser = req.user;
    const id = req.body._id;
    if (id == null || id.length === 0) {
      return res.status(403).send({
        success: false,
        message: '_id must be provided'
      })
    }
    const AstroDataCollection = db.collection('astro_data');
    var item = await AstroDataCollection.findOne({
      _id: ObjectId(id),
      uid: ObjectId(loggedUser.id)
    });
    return res.send({
      status: 'success',
      data: item
    });
  };


  module.getMy = async function (req, res) {
    const loggedUser = req.user;
    const AstroDataCollection = db.collection('astro_data');
    var items = await AstroDataCollection.find({
      uid: ObjectId(loggedUser.id)
    }).toArray();
    return res.send({
      status: 'success',
      data: items
    });
  };


  module.findBySharedCode = async function (req, res) {
    const shared_code = req.body.code;
    const AstroDataCollection = db.collection('astro_data');
    var item = await AstroDataCollection.findOne({
      shared_code: shared_code
    });
    return res.send({
      status: 'success',
      data: item
    });
  };


  module.getMySharedCode = async function (req, res) {
    const aid = req.body.id;
    const loggedUser = req.user;
    const AstroDataCollection = db.collection('astro_data');

    var item = await AstroDataCollection.findOne({
      _id: ObjectId(aid),
      uid: ObjectId(loggedUser._id)
    });
    if (item != null) {
      if (item.shared_code) {
        return res.send({
          status: 'success',
          data: item.shared_code
        });
      } else {
        // const shared_code = "rf";
        const shared_code = randomstring(4) + '-' + randomstring(6);
        await AstroDataCollection.updateOne({
          _id: ObjectId(aid),
          uid: ObjectId(loggedUser._id)
        }, {
          $set: {
            shared_code: shared_code
          }
        });
      }
    } else {
      return res.send({
        status: 'success',
        data: null
      });
    }
  };


  module.add = async function (req, res) {
    var astro_data = req.body;

    var dt = dateTime.create();
    astro_data.created_time = astro_data.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Adding post: ' + JSON.stringify(astro_data));

    const loggedUser = req.user;
    astro_data.uid = ObjectId(loggedUser.id);

    const AstroDataCollection = db.collection('astro_data');
    try {
      const result = await AstroDataCollection.insertOne(astro_data, { safe: true })
      // console.log('Success: ' + JSON.stringify(result));
      return res.send({
        status: 'success',
        data: astro_data
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }

  module.update = async function (req, res) {
    var astro_data = req.body;
    if (!astro_data.hasOwnProperty('_id')) {
      return res.status(403).send({
        success: false,
        message: 'no _id provided'
      })
    }
    var id = ObjectId(astro_data._id);
    console.log('Updating astro_data: ' + id);
    delete astro_data['_id'];
    delete astro_data['uid'];

    var dt = dateTime.create();
    astro_data.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Updating astro_data: ' + id);
    // console.log(JSON.stringify(astro_data));

    const loggedUser = req.user;

    const AstroDataCollection = db.collection('astro_data');
    // console.log(JSON.stringify(astro_data));
    try {
      // console.log('update~~~~')
      console.log({
        _id: ObjectId(id),
        uid: ObjectId(loggedUser.id)
      })
      await AstroDataCollection.updateOne({
        _id: ObjectId(id),
        uid: ObjectId(loggedUser.id)
      }, {
        $set: astro_data
      })

      // console.log('Success: ' + JSON.stringify(result));
      // console.log('Success ', astro_data);
      return res.send({
        status: 'success',
        data: astro_data
      });
    }
    catch (error) {
      // console.log('~error', error)
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }

  module.delete = async function (req, res) {
    const loggedUser = req.user;

    var astro_data = req.body;
    if (!astro_data.hasOwnProperty('_id')) {
      return res.status(403).send({
        success: false,
        message: 'no _id provided'
      })
    }
    var id = ObjectId(astro_data._id);
    console.log('Deleting astro_data: ' + id);

    const AstroDataCollection = db.collection('astro_data');

    try {
      const result = await AstroDataCollection.remove({
        _id: ObjectId(id),
        uid: ObjectId(loggedUser.id)
      }, { safe: true })

      return res.send({
        status: 'success',
        // data: req.body //result
      });
    }
    catch (error) {
      return res.status(403).send({
        success: false,
        message: error
      });
    }
  }


  return module;
}
