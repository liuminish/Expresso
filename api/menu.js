const express = require('express');
const menuRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemRouter = require('./menu-item');

//get all menus
menuRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Menu`, (err, menus) => {
        if (err) {
            next(err)
        } else {
            res.status(200).json({menus: menus})
        }
    })
})

//create new menu
menuRouter.post('/', (req, res, next) => {
    const { title } = req.body.menu;

    if (!title) {
        return res.sendStatus(400)
    } else {
        db.run(`INSERT INTO Menu (title) VALUES ($title)`, {$title: title}, function(err) {
            if (err) {
                next(err)
            } else {
                db.get(`SELECT * FROM Menu WHERE id = $id`, {$id: this.lastID}, function(err, menu) {
                    if (err) {
                        next(err)
                    } else {
                        res.status(201).json({menu: menu})
                    }
                })
            }
        })
    }
})

//route param
menuRouter.param('menuId', (req, res, next, id) => {
    db.get(`SELECT * FROM Menu WHERE id = $id`, {$id: id}, (err, menu) => {
        if (err) {
            return res.sendStatus(404)
        } else if (menu) {
            req.menu = menu;
            next();
        } else {
            return res.sendStatus(404)
        }
    })
})

menuRouter.use('/:menuId/menu-items', menuItemRouter)

//get one menu
menuRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu})
})

//update on menu
menuRouter.put('/:menuId', (req, res, next) => {
    const { title } = req.body.menu;
    if (!title) {
        return res.sendStatus(400)
    } else {
        db.run(`UPDATE Menu SET title = $title WHERE id = $id`, {$id: req.params.menuId, $title: title}, (err) => {
            if (err) {
                next(err)
            } else {
                db.get(`SELECT * FROM Menu WHERE id = $id`, {$id: req.params.menuId}, (err, menu) => {
                    if (err) {
                        next(err)
                    } else {
                        res.status(200).json({menu: menu})
                    }
                })
            }
        })
    }
})

//delete one menu
menuRouter.delete('/:menuId', (req, res, next) => {
    db.get(`SELECT * FROM MenuItem WHERE menu_id = $menuId`, {$menuId: req.params.menuId}, (err, menuItem) => {
        if(err) {
            next(err)
        } else if (menuItem) {
            return res.sendStatus(400)
        } else {
            db.run(`DELETE FROM Menu WHERE id = $id`, {$id: req.params.menuId}, (err) => {
                if (err) {
                    next(err)
                } else {
                    res.sendStatus(204)
                }
            })
        }
    })
})

module.exports = menuRouter;