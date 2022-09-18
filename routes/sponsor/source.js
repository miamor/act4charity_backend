const { ObjectId } = require('mongodb'); // or ObjectID 

module.exports = function (db) {
  var module = {};

  module.find = async function (req, res) {
    cat = req.body.cat;
    matchAr = {}
    if (cat != null && cat.length > 0) {
      matchAr = {
        cat: { $in: cat }
      }
    }
    const SourceCollection = db.collection('source');
    var items = await SourceCollection.find(matchAr).toArray();
    return res.send({
      status: 'success',
      data: items
    });
  };

  module.findMy = async function (req, res) {
    const loggedUser = req.user;
    const SourceCollection = db.collection('source');
    var items = await SourceCollection.find({
      uid: ObjectId(loggedUser.id)
    }).toArray();
    return res.send({
      status: 'success',
      data: items
    });
  };


  module.add = async function (req, res) {
    var source = req.body;

    var dt = dateTime.create();
    source.created_time = source.updated_time = dt.format('Y-m-d H:M:S');
    console.log('Adding post: ' + JSON.stringify(source));

    const loggedUser = req.user;
    source.uid = ObjectId(loggedUser.id);

    const SourceCollection = db.collection('source');
    try {
      await SourceCollection.insertOne(source, { safe: true })
      // console.log('Success: ' + JSON.stringify(result));
      console.log('Success ', result.ops);
      return res.send({
        status: 'success',
        data: result.ops[0]
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
    var source = req.body;
    if (!source.hasOwnProperty('_id')) {
      return res.status(403).send({
        success: false,
        message: 'no _id provided'
      })
    }
    var id = source._id;
    console.log('Updating source: ' + id);
    delete source._id;

    var dt = dateTime.create();
    source.updated_time = dt.format('Y-m-d H:M:S');
    // console.log(JSON.stringify(source));

    const loggedUser = req.user;

    const SourceCollection = db.collection('source');
    // console.log(JSON.stringify(source));
    try {
      // console.log('update~~~~')
      console.log({
        _id: ObjectId(id),
        uid: ObjectId(loggedUser.id)
      })
      await SourceCollection.updateOne({
        _id: ObjectId(id),
        uid: ObjectId(loggedUser.id)
      }, {
        $set: source
      })

      // console.log('Success: ' + JSON.stringify(result));
      // console.log('Success ', source);
      return res.send({
        status: 'success',
        data: source
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
    var source = req.body;
    if (!source.hasOwnProperty('_id')) {
      return res.status(403).send({
        success: false,
        message: 'no _id provided'
      })
    }
    var id = source._id;
    console.log('Deleting source: ' + id);

    const SourceCollection = db.collection('source');

    try {
      const result = await SourceCollection.remove({ _id: ObjectId(id) }, { safe: true })
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
