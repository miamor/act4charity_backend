module.exports.charity_act_builder = function (charity_act_data) {

  /*
   * Won't live without you
   */
  if (!charity_act_data.hasOwnProperty('name')) {
    return null
  }
  if (charity_act_data.name == null || charity_act_data.name.length === 0) {
    return null
  }


  /*
   * Init value
   */
  charityActJson = {
    //? basic file info
    name: null,
  }


  /*
   * Overwrite some data
   */
  for (const key in charity_act_data) {
    if (charityActJson.hasOwnProperty(key)) {
      // console.log(`${key}: ${user[key]}`)
      charityActJson[key] = charity_act_data[key]
    }
  }


  return charityActJson
}