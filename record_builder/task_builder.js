module.exports.task_builder = function (task, db) {

  /*
   * Won't live without you
   */
  if (!task.hasOwnProperty('paths') || !task.hasOwnProperty('otype') || !task.hasOwnProperty('type') || !task.hasOwnProperty('flow')) {
    return null
  }
  if (task.paths == null || task.paths.length === 0 ||
    task.otype == null || task.otype.length === 0 ||
    task.type == null || task.type.length === 0 ||
    task.flow == null || !Array.isArray(task.flow) || task.flow.length === 0) {
    return null
  }


  /*
   * Check if all module code in flow exist
   */
  err = false
  await Promise.all(task.flow.map(async mod_code => {
    const TheCollection = db.collection('modules')

    var item = await TheCollection.findOne({
      code: { $eq: mod_code }
    }, {
      projection: {
        _id: 1,
      }
    })

    if (item == null) {
      err = true
    }
  }))

  if (err === true) {
    return null
  }


  /*
   * Init
   */
  taskJson = {
    //? paths to analyze
    paths: null,

    //? `otype` for object type
    //? what type of data this module works on ?
    //? now support 3 types
    //? `file` | `url` | `traffic`
    //? Note that even with those modules that take input data in json (or any other) format, we only consider the original data that they tackle. For example, a `detector` (or even `processor`) module might use json files or texts as inputs, but the aim of the module is to detect malicious `file`/`url`, or to analyse `file`/`url`,...
    //? sometimes even I can't understand what I'm typing. Cheers to you if you can understand.
    otype: null,

    //? this task is tasked to run with one module or a module flow
    type: null,

    //? array of modules' code (this array has one element if the task is to run with one module)
    flow: null,

    //? is this task collected by collector yet
    run: false
  }


  /*
   * Overwrite some data
   */
  for (const key in task) {
    if (taskJson.hasOwnProperty(key)) {
      // console.log(`${key}: ${user[key]}`)
      taskJson[key] = task[key]
    }
  }

  /*
   * If using this record builder, run field will always be set to false.
   * Collector will change this to true when it collects this task to issue to the modules_flow
   */
  taskJson.run = false


  return taskJson
}