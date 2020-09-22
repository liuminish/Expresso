const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets');

//get all employees
employeesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, employees) => {
        if (err) {
            next(err)
        } else {
            res.status(200).json({employees: employees})
        }
    })
})

//route Param
employeesRouter.param('employeeId', (req, res, next, id) => {
    db.get(`SELECT * FROM Employee WHERE id = $id`, {$id: id}, (err, employee) => {
        if (err) {
            res.sendStatus(404)
        } else if (employee) {
            req.employee = employee;
            next()
        } else {
            res.sendStatus(404)
        }
    })
})

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//create new employee
employeesRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;

    const sql = `INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)`;
    const values = {$name: name, $position: position, $wage: wage, $isCurrentEmployee: isCurrentEmployee}

    if (!name || !position || !wage) {
        res.sendStatus(400)
    } else {
        db.run(sql, values, function(err) {
            if (err) {
                next(err)
            } else {
                db.get(`SELECT * FROM Employee WHERE id = $id`, {$id: this.lastID}, (err, employee) => {
                    if(err) {
                        next(err)
                    } else {
                        res.status(201).json({employee: employee})
                    }
                })
            }
        })
    }
})

//get one employee
employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee})
})

//update one employee
employeesRouter.put('/:employeeId', (req, res, next) => {
    const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;

    const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE id = $id`;
    const values = {$id: req.params.employeeId, $name: name, $position: position, $wage: wage, $isCurrentEmployee: isCurrentEmployee}

    if (!name || !position || !wage) {
        return res.sendStatus(400)
    } else {
        db.run(sql, values, (err) => {
            if (err) {
                next(err)
            } else {
                db.get(`SELECT * FROM Employee WHERE id = $id`,{$id: req.params.employeeId}, (err, employee) => {
                    if (err) {
                        next(err)
                    } else {
                        res.status(200).json({employee: employee})
                    }
                })
            }
        })
    }
})

//delete employee
employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = $id`, {$id: req.params.employeeId}, (err) => {
        if (err) {
            next(err)
        } else {
            db.get(`SELECT * FROM Employee WHERE id = $id`, {$id: req.params.employeeId}, (err, employee) => {
                if(err) {
                    next(err)
                } else {
                    res.status(200).json({employee: employee})
                }
            })
        }
    })
})

module.exports = employeesRouter;