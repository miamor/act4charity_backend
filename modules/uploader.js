function getFileExtension(filename) {
  // const allowedFileExt = ['JPEG', 'JPG', 'PNG', 'GIF', 'TIFF', 'PSD', 'PDF']
  const fileExt = /[^.]+$/.exec(filename)
  return fileExt[0].toUpperCase()
}

var self = module.exports = {

  /* ****************************
   * 
   * Upload one file
   * 
   * ****************************/
  uploadOneFile: function (file, prefix, allowExts) {
    /*
     * If files extention limted
     */
    const ext = getFileExtension(file.name)
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
        message: file.name + ' is not allowed'
      }
    }

    // console.log('[uploadOneFile] file', file)

    /*
     * move file to uploads directory
     * since this is deployed in docker, the uploads folder is mounted at /data/uploaded_file
     */
    //! TODO: Change the path plzzz
    const outPath = '/root/act4charity_backend/uploads/' + prefix + '__' + file.name

    console.log('[uploader][uploadOneFile]', outPath)
    file.mv(outPath)

    const data = {
      // success: true,

      // file_name: file.name,
      // file_mimetype: file.mimetype,
      // file_size: file.size,
      file_path: outPath
    }

    return data
  },


  /* ****************************
   * 
   * Upload multiple files
   * 
   * ****************************/
  uploadFiles: function (req, res, allowExts) {
    try {
      if (!req.files) {
        return {
          status: 'error',
          message: 'No file uploaded'
        }
      } else {
        let data = []

        console.log('[uploader][uploadFiles] req.files.files', req.files.files)

        const d = new Date()
        const prefix = req.user.username + '__' + d.toJSON().slice(0, 19).replace('T', '_').replace(':', '-').replace(':', '-')
        console.log('[uploader][uploadFiles] prefix', prefix)

        //? loop all files
        if (Array.isArray(req.files.files)) {
          for (var file of req.files.files) {
            const data_one = self.uploadOneFile(file, prefix, allowExts)
            data.push(data_one)
          }
        } else {
          // console.log('[uploader][uploadFiles] here')
          data.push(self.uploadOneFile(req.files.files, prefix, allowExts))
        }

        // console.log('[uploader][uploadFiles] data', data)

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
