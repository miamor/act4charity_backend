function getFileExtension(filename) {
  // const allowedFileExt = ['JPEG', 'JPG', 'PNG', 'GIF', 'TIFF', 'PSD', 'PDF']
  const fileExt = /[^.]+$/.exec(filename)
  return fileExt[0].toUpperCase()
}

var self = module.exports = {
  uploadFile: function (req, res, allowExts) {
    try {
      if (!req.files) {
        return {
          status: 'error',
          message: 'No file uploaded'
        }
      } else {
        let data = []

        // console.log('req.files.files', req.files.files)

        //? loop all files
        for (var file of req.files.files) {

          /*
           * If files extention limted
           */
          ext = getFileExtension(file.name)
          if (allowExts != null && Array.isArray(allowExts) && allowExts.length > 0 && !allowExts.includes(ext)) {
            //? if not in allowed file format, skip uploading this file
            // data.push({
            //   success: false,
            //   message: file.name+' is not allowed'
            // })
            // continue
            //? just kill the whole batch. it's easier
            return {
              status: 'error',
              message: file.name+' is not allowed'
            }
          }

          // console.log('file', file)

          /*
           * move file to uploads directory
           * since this is deployed in docker, the uploads folder is mounted at /data/uploaded_file
           */
          //! TODO: Change the path plzzz
          outPath = '/home/ubuntu/Documents/SMaD/data/uploaded_file/' + file.name
          file.mv(outPath)

          // push file details
          data.push({
            // success: true,

            file_name: file.name,
            file_mimetype: file.mimetype,
            file_size: file.size,
            file_path: outPath
          })
        }

        // console.log('data', data)

        // return response
        return {
          status: 'success',
          message: 'Files are uploaded',
          data: data
        }
      }
    } catch (err) {
      return {
        status: 'error',
        message: "Something happen when uploading files. " + JSON.stringify(err)
      }
    }
  }
}