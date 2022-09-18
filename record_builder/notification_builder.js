module.exports.notification_builder = function (noti_data) {

  /*
   * Won't live without you
   */
  if (!noti_data.hasOwnProperty('to_uid') || !noti_data.hasOwnProperty('message')) {
    return null
  }
  if (noti_data.to_uid == null || noti_data.to_uid.length === 0 ||
    noti_data.message == null || noti_data.message.length === 0) {
    return null
  }

  /*
   * Init
   */
  notiJson = {
    message: null,
    to_uid: null
  }


  /*
   * Overwrite some data
   */
  for (const key in noti_data) {
    if (notiJson.hasOwnProperty(key)) {
      // console.log(`${key}: ${noti[key]}`)
      notiJson[key] = noti_data[key]
    }
  }


  return notiJson
}