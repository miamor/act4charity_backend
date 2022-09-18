module.exports.user_builder = function (user_data) {

  /*
   * Won't live without you
   */
  if (!user_data.hasOwnProperty('username') || !user_data.hasOwnProperty('email') || !user_data.hasOwnProperty('password')) {
    return null
  }
  if (user_data.username == null || user_data.username.length === 0 ||
    user_data.email == null || user_data.email.length === 0 ||
    user_data.password == null || user_data.password.length === 0) {
    return null
  }

  if (!user_data.hasOwnProperty('type') || user_data.type == null || user_data.type.length === 0) {
    user_data.type = 'user'
  }


  /*
   * Init
   */
  userJson = {
    //? funny thing, these fields should not be in the builder, since these are not to be modified. They should be explicitly edited if necessary.
    // type: null,

    // email: null,
    // username: null,
    // password: null,

    //? some fields could be modified here
    name: null
  }


  /*
   * Overwrite some data
   */
  for (const key in user_data) {
    if (userJson.hasOwnProperty(key)) {
      // console.log(`${key}: ${user[key]}`)
      userJson[key] = user_data[key]
    }
  }


  return userJson
}