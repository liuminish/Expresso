const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//get all timesheets for one employee
timesheetsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Timesheet WHERE employee_id = $id`, {$id: req.params.employeeId}, (err, timesheets) => {
        if (err) {
            next(err)
        } else {
            res.status(200).json({timesheets: timesheets})
        }
    })
})

//create timesheet for one employee
timesheetsRouter.post('/', (req, res, next) => {
    const {
        hours,
        rate,
        date
    } = req.body.timesheet
    
    const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)`;
    const values = {$hours: hours, $rate: rate, $date: date, $employeeId: req.params.employeeId};
    
    if (!hours || !rate || !date) {
        return res.sendStatus(400)
    } else {
        db.run(sql, values, function(err) {
            if (err) {
                next(err)
            } else {
                db.get(`SELECT * FROM Timesheet WHERE id = $id`, {$id: this.lastID}, function(err, timesheet) {
                    if(err) {
                        next(err)
                    } else {
                        res.status(201).json({timesheet: timesheet})
                    }
                })
            }
        })
    }
})

//route param
timesheetsRouter.param('timesheetId', (req, res, next, id) => {
    db.get(`SELECT * FROM Timesheet where id = $id`, {$id: id}, (err, timesheet) => {
        if (err) {
            return res.sendStatus(404)
        } else if (timesheet) {
            req.timesheet = timesheet;
            next();
        } else {
            res.sendStatus(404)
        }
    })
})

//update one timesheet
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const {
        hours,
        rate,
        date
    } = req.body.timesheet
    
    const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE id = $id`;
    const values = {$id: req.params.timesheetId, $hours: hours, $rate: rate, $date: date, $employeeId: req.params.employeeId};
    
    if (!hours || !rate || !date) {
        return res.sendStatus(400)
    } else {
        db.run(sql, values, (err) => {
            if (err) {
                next(err)
            } else {
                db.get(`SELECT * FROM Timesheet WHERE id = $id`, {$id: req.params.timesheetId}, (err, timesheet) => {
                    if (err) {
                        next(err)
                    } else {
                        res.status(200).json({timesheet: timesheet})
                    }
                })
            }
        })
    }
})

//delete timesheet
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    db.run(`DELETE FROM Timesheet WHERE id = $id`, {$id: req.params.timesheetId}, (err) => {
        if (err) {
            next(err)
        } else {
            res.sendStatus(204)
        }
    })
})


module.exports = timesheetsRouter;