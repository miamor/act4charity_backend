module.exports.challenge_builder = function (challenge_data) {

  /*
   * Won't live without you
   */
  if (!challenge_data.hasOwnProperty('title') || !challenge_data.hasOwnProperty('type')) {
    return null
  }
  if (challenge_data.title == null || challenge_data.title.length === 0 ||
    challenge_data.type == null || challenge_data.type === 0) {
    return null
  }


  /*
   * Init value
   */
  challengeJson = {
    //? basic file info
    title: null,
    type: null,

    title: null,
    des: null,

    //? for walk challenge only
    distance: 0, //? distance to complete this challenge
    step: 0, //? steps to complete this challenge
    time: 0, //? estimate time to complete this challenge

    //? for discovery challenge only
    location_name: null,
    coordinates: {
      latitude: -37.82014135870454,
      longitude: 144.96851676141537,
    },
    checkin_required: 0, //? 0: do not require users to check in | 1: require


    //? 2 points will be rewarded after completing
    reward: 0,

    //? $5 will be donated after completing
    money: 0,

    //? money will be donated to charity activity id #X after completing
    charity_activity_id: null,
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