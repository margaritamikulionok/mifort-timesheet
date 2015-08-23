var utils = require('./libs/utils');
var dbSettings = require('./libs/mongodb_settings');

exports.save = function(req, res) {
    if(req.body) {
        var timelogCollection = dbSettings.timelogCollection();
        var batch = timelogCollection.initializeUnorderedBulkOp({useLegacyOps: true});
        
        var ids = [];
        var timelogs = req.body.timelog;
        timelogs.forEach(function(log) {
            if(log._id) {
                ids.push(log._id);
                batch.find({_id: log._id}).upsert().replaceOne(log);
            } else {
                batch.insert(log);
            }
        });

        batch.execute(function(err, result) {
            findAllTimelogsByIds(ids, function(err, timelogs) {
                if(err) {
                    res.status(500).json(err);
                }
                res.json({timelog: timelogs});
            });
        });
    }
};

function findAllTimelogsByIds(ids, callback) {
    var timelogCollection = dbSettings.timelogCollection();
    timelogCollection.find({_id:{ $in: ids}}, {"sort": "date"}).toArray(function(err, timelogs) {
        callback(err, timelogs);
    });
}

exports.getForPeriod = function(req, res) {
    getCurrentPeriod(req, res, findTimeLog);
};

function getCurrentPeriod(req, res, callback) {
    var query = getPeriodQueryObject(req, res);
    if(query) {
        var timesheets = dbSettings.db.collection(dbSettings.timesheet);
        timesheets.findOne(query[0],
                           query[1], 
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    if(doc) {
                        console.log(doc);
                        callback(req, res, db, doc.periods[0]);
                    } else {
                        res.status(400).json({});
                    }
                }
            );
    } else {
        res.status(500).json({error: "Empty parameters"});
    }
}

function findTimeLog(req, res, period) {
    var userId = utils.getUserId(req, res);
    var projectId = utils.getProjectId(req, res);
    if(userId && period && projectId) {
        var timelogs = dbSettings.db.collection(dbSettings.timelog);
        timelogs.findOne({userId : parseInt(userId), //dangerous
                          periodId: period.id,
                          projectId: projectId},
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    res.json(doc);
                }
            );
    }
}

function getPeriodQueryObject(req, res) {
    var projectId = utils.getProjectId(req, res);
    var periodId = utils.getPeriodId(req, res);
    var currentDate = new Date();
    if(!projectId) {
        return false;
    }

    if(periodId) {
        return [{
                    projectId: projectId, 
                    "periods.id": parseInt(periodId)
                },
                {
                    periods: {$elemMatch: {id: parseInt(periodId)}}
                }];
    } else {
        return [
            {
                projectId: projectId,
                "periods.startDate":{ $lte : currentDate},
                "periods.endDate": {$gte: currentDate}
            },
            {
                periods: {$elemMatch: {startDate: { $lte : currentDate},
                                       endDate: {$gte: currentDate}}}
            }];

    }
}