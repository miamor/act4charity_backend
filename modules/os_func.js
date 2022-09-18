const { exec } = require("child_process")

module.exports = {
  execCommand: function (cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }
        resolve(stdout)
      })
    })
  }
}