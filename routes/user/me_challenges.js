const { ObjectId } = require('mongodb') // or ObjectID 
const querier = require('../../modules/querier')

module.exports = function (db) {
  var module = {}

  querier.db = db
  const collection_name = 'challenges' //! change this

  const agg_join_users_query = [{
    $lookup: {
      from: "users",
      let: { "user_id_list": "$participants" },
      pipeline: [{
        $match: {
          $expr: {
            $in: ["$_id", "$$user_id_list"]
          }
        }
      }],
      as: "participants_details"
    }
  }]
  const agg_join_query = [{
    $lookup: {
      from: "interests",
      let: { "interest_id_list": "$challenge_detail.interest" },
      pipeline: [{
        $match: {
          $expr: {
            $in: ["$_id", "$$interest_id_list"]
          }
        }
      }],
      as: "challenge_detail.interests_details"
    }
  }, {
    $lookup: {
      from: "charities",
      let: { "charity_id": "$challenge_detail.charity" },
      pipeline: [{
        $match: {
          $expr: {
            $eq: ["$_id", "$$charity_id"],
          }
        }
      }],
      as: "challenge_detail.charity_detail"
    }
  }, {
    $unwind:
    {
      path: "$challenge_detail.charity_detail",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $lookup: {
      from: "sponsors",
      let: { "sponsor_id": "$challenge_detail.sponsor" },
      pipeline: [{
        $match: {
          $expr: {
            $eq: ["$_id", "$$sponsor_id"],
          }
        }
      }],
      as: "challenge_detail.sponsor_detail"
    }
  }, {
    $unwind:
    {
      path: "$challenge_detail.sponsor_detail",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $project: {
      interest: 0,
      place: 0,
      charity: 0,
      sponsor: 0,
    }
  }]

  const agg_join_place_query = [{
    $lookup: {
      from: "places",
      let: { "place_id": "$challenge_detail.place" },
      pipeline: [{
        $match: {
          $expr: {
            $eq: ["$_id", "$$place_id"]
          }
        }
      }],
      as: "challenge_detail.place_detail"
    }
  }, {
    $unwind:
    {
      path: "$challenge_detail.place_detail",
      preserveNullAndEmptyArrays: true
    }
  }]



  /* ****************************
   * 
   * Retrieve my completed challenges
   * 
   * ****************************/
  module.getChallengesCompleted = async function (req, res) {

    const params = req.body
    const user_id = ObjectId(req.user.id)

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    /*
     * Find completed challenges
     */
    var aggAr = [{
      $match: {
        $and: [{
          active: 2
        }, {
          participants: user_id
        }]
      }
    // }, {
    //   $lookup: {
    //     from: "challenge_invitation",
    //     let: { "challenge_accepted_id": "$_id" },
    //     pipeline: [{
    //       $match: {
    //         $expr: {
    //           $and: [
    //             { $eq: ["$challenge_accepted", "$$challenge_accepted_id"] },
    //             { $eq: ["$accept", 1] },
    //           ]
    //         }
    //       }
    //     }],
    //     as: "challenge_detail"
    //   }
    // }, {
    //   $unwind: {
    //     path: "$my_invitation_status",
    //     preserveNullAndEmptyArrays: true
    //   }
    }, {
      $lookup: {
        from: "challenges",
        let: { "challenge_id": "$challenge" },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$_id", "$$challenge_id"],
            }
          }
        }],
        as: "challenge_detail"
      }
    }, {
      $unwind: {
        path: "$challenge_detail",
        preserveNullAndEmptyArrays: false
      }
    }]

    aggAr = [...aggAr, ...agg_join_place_query, ...agg_join_users_query, ...agg_join_query]


    /*
     * Pagination
     */
    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    console.log('aggAr', JSON.stringify(aggAr))
    // console.log('aggAr', aggAr)


    const TheCollection = db.collection('challenge_accepted')
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  }




  /* ****************************
   * 
   * Retrieve my ongoing challenge
   * 
   * ****************************/
  module.getChallengesOngoing = async function (req, res) {

    const params = req.body
    const user_id = ObjectId(req.user.id)

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    /*
     * Find ongoing challenges
     */
    var aggAr = [{
      $match: {
        $and: [{
          $or: [{
            active: 0
          }, {
            active: 1
          }]
        }, {
          participants: user_id
        }]
      }
    // }, {
    //   $lookup: {
    //     from: "challenge_invitation",
    //     let: { "challenge_accepted_id": "$_id" },
    //     pipeline: [{
    //       $match: {
    //         $expr: {
    //           $and: [
    //             { $eq: ["$challenge_accepted", "$$challenge_accepted_id"] },
    //             { $eq: ["$accept", 1] },
    //           ]
    //         }
    //       }
    //     }],
    //     as: "challenge_detail"
    //   }
    // }, {
    //   $unwind: {
    //     path: "$my_invitation_status",
    //     preserveNullAndEmptyArrays: true
    //   }
    }, {
      $lookup: {
        from: "challenges",
        let: { "challenge_id": "$challenge" },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$_id", "$$challenge_id"],
            }
          }
        }],
        as: "challenge_detail"
      }
    }, {
      $unwind: {
        path: "$challenge_detail",
        preserveNullAndEmptyArrays: true
      }
    }]

    aggAr = [...aggAr, ...agg_join_place_query, ...agg_join_users_query, ...agg_join_query]


    /*
     * Pagination
     */
    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    console.log('aggAr', JSON.stringify(aggAr))



    const TheCollection = db.collection('challenge_accepted')
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  }




  /* ****************************
   * 
   * Retrieve invitations to me
   * 
   * ****************************/
  module.getInvitationsToMe = async function (req, res) {

    const params = req.body
    const user_id = ObjectId(req.user.id)

    const filter = params.filter,
      page = params.page || 1,
      num_per_page = params.num_per_page || 10,
      do_count = params.do_count || true

    /*
     * Find completed challenges
     */
    var aggAr = [{
      $match: {
        $and: [
          { to_uid: user_id },
          { accept: 0 }
        ]
      }
    }, {
      $lookup: {
        from: "users",
        let: { "user_id": "$from_uid" },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$_id", "$$user_id"],
            }
          }
        }, {
          $project: {
            username: 1,
            profile_picture: 1,
            firstname: 1
          }
        }],
        as: "from_user"
      }
    }, {
      $unwind: {
        path: "$from_user",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $lookup: {
        from: "challenges",
        let: { "challenge_id": "$challenge" },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$_id", "$$challenge_id"],
            }
          }
        }],
        as: "challenge_detail"
      }
    }, {
      $unwind: {
        path: "$challenge_detail",
        preserveNullAndEmptyArrays: false
      }
    }]

    aggAr = [...aggAr, ...agg_join_place_query, ...agg_join_query]


    /*
     * Pagination
     */
    aggAr.push({
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * num_per_page }, { $limit: num_per_page }],
        totalCount: [
          {
            $count: 'total'
          }
        ]
      }
    })

    console.log('aggAr', JSON.stringify(aggAr))



    const TheCollection = db.collection('challenge_invitation')
    const items = await TheCollection.aggregate(aggAr).toArray()

    return res.send({
      status: 'success',
      data: items[0].paginatedResults,
      total: do_count ? (items[0].totalCount.length > 0 ? items[0].totalCount[0].total : 0) : -1
    })
  }



  return module
}
