module.exports.charity_org_builder = function (charity_org_data) {

  /*
   * Won't live without you
   */
  if (!charity_org_data.hasOwnProperty('name')) {
    return null
  }
  if (charity_org_data.name == null || charity_org_data.name.length === 0) {
    return null
  }


  /*
   * Init value
   */
  charityActJson = {
    //? basic file info
    name: null,
    des: null,
  }


  /*
   * Overwrite some data
   */
  for (const key in charity_org_data) {
    if (charityActJson.hasOwnProperty(key)) {
      // console.log(`${key}: ${user[key]}`)
      charityActJson[key] = charity_org_data[key]
    }
  }


  return charityActJson
}