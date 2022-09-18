module.exports.challenge_builder = function (challenge_data) {

  /*
   * Won't live without you
   */
  if (!challenge_data.hasOwnProperty('name') || !challenge_data.hasOwnProperty('type')) {
    return null
  }
  if (challenge_data.name == null || challenge_data.name.length === 0 ||
    challenge_data.type == null || challenge_data.type === 0) {
    return null
  }


  /*
   * Init value
   */
  challengeJson = {
    //? basic file info
    name: null,
    type: null,
  }


  /*
   * Overwrite some data
   */
  for (const key in challenge_data) {
    if (challengeJson.hasOwnProperty(key)) {
      // console.log(`${key}: ${user[key]}`)
      challengeJson[key] = challenge_data[key]
    }
  }


  return challengeJson
}