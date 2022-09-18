const { ObjectId } = require('mongodb'); // or ObjectID 

module.exports = function (db) {
  var module = {};

  module.findById = async function (req, res) {
    // const loggedUser = req.user;
    const id = req.body._id;
    if (id == null || id.length === 0) {
      return res.status(403).send({
        success: false,
        message: '_id must be provided'
      })
    }
    const AstroDataCollection = db.collection('astro_data');
    var item = await AstroDataCollection.findOne({
      _id: ObjectId(id)
    });
    return res.send({
      status: 'success',
      data: item
    });
  };


  return module;
}
