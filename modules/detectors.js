var fs = require('fs'); // Load the filesystem module
// const { exec } = require('child_process')
const os_func = require('./os_func')

var self = module.exports = {
  resolveAfter2Seconds: function (x) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x * 2)
      }, 2000)
    })
  },

  getFilesizeInBytes: function (filepath) {
    var stats = fs.statSync(filepath)
    var fileSizeInBytes = stats.size
    return fileSizeInBytes
  },

  hashFiles: function (paths, hashes_dict) {
    return new Promise(resolve => {
      hashme_cmd = './hashme.sh ' + paths.join(' ')
      os_func.execCommand(hashme_cmd).then(out_str => {
        if (out_str == '') {
          resolve(hashes_dict)
        }

        // console.log('out_str :', out_str)

        const ar = out_str.split(/(\*\*\*\*\*(.*)\*\*\*\*\*)\n/).slice(1)
        for (var i = 0; i < ar.length; i += 3) {
          htype = ar[i + 1]
          hvals_ar = ar[i + 2].split('\n')

          // console.log('\n***********\nhtype', htype, hvals_ar)

          //? extra process if it's ssdeep output
          if (htype === 'ssdeep') {
            //? remove warning lines
            while (hvals_ar[0] !== "ssdeep,1.1--blocksize:hash:hash,filename") {
              hvals_ar = hvals_ar.slice(1)
            }
            //? remove heading line
            hvals_ar = hvals_ar.slice(1)
          }

          //? map to hashes_dict
          var k = 0
          hvals_ar.map(hval => {
            if (hval.length === 0) return
            hashes_dict[htype][paths[k]] = hval.trim()
            k++
          })

        }

        resolve(hashes_dict)
      }).catch(err => {
        console.error(`[hashFiles] error: ${err}`);
        resolve(hashes_dict)
      })
    })
  },

  static4file: function (fullPath, fileJson) {
    return new Promise(resolve => {
      console.log('[static4file] static detector called')

      if (fullPath == null || typeof fullPath !== 'string' ||
        fileJson == null || typeof fileJson !== 'object'
      ) {
        console.error('[static4file] Invalid params')
        resolve(fileJson)
      }

      scan = './BinarySearch ' + fullPath
      // out = ''

      os_func.execCommand(scan).then(out_str => {

        // console.log('os >>>', res)

        // out_str = out.decode('utf-8')
        if (out_str == '') {
          resolve(fileJson)
        }

        if (out_str.split('/')[0] != '') {
          // console.log(out, out_str, out_str.split('/'), out.decode('utf-8'))
          fileJson.md5 = out_str.split('/')[1]

          fileJson.static_detected = true
          fileJson.static_malware_type = out_str.split('/')[0]

          resolve(fileJson)
        }

      }).catch(err => {
        console.error(`[static4file] error: ${err}`);
        resolve(fileJson)
      })
    })
  },

  static4url: function (fullPath, fileJson) {
    return new Promise(resolve => {
      console.log('[static4url] static detector called')

      if (fullPath == null || typeof fullPath !== 'string' ||
        fileJson == null || typeof fileJson !== 'object'
      ) {
        console.error('[static4url] Invalid params')
        resolve(fileJson)
      }

      scan = './BinarySearch ' + fullPath
      // out = ''

      os_func.execCommand(scan).then(out_str => {

        // console.log('os >>>', res)

        // out_str = out.decode('utf-8')
        if (out_str == '') {
          resolve(fileJson)
        }

        if (out_str.split('/')[0] != '') {
          // console.log(out, out_str, out_str.split('/'), out.decode('utf-8'))
          fileJson.md5 = out_str.split('/')[1]

          fileJson.static_detected = true
          fileJson.static_malware_type = out_str.split('/')[0]

          resolve(fileJson)
        }

      }).catch(err => {
        console.error(`[static4url] error: ${err}`);
        resolve(fileJson)
      })
    })
  },

  // bar: function(req, res, next) {
  //   self.static();
  // }

}
