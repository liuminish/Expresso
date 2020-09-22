const express = require('express');
const menuItemRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//get all menu items
menuItemRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM MenuItem WHERE menu_id = $id`, {$id: req.params.menuId}, (err, menuItems) => {
        if (err) {
            next(err)
        } else {
            res.status(200).json({menuItems: menuItems})
        }
    })
})

//create menu item for one menu
menuItemRouter.post('/', (req, res, next) => {
    const {
        name,
        description,
        inventory,
        price
    } = req.body.menuItem;

    const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)`;
    const values = {$name: name, $description: description, $inventory: inventory, $price: price, $menuId: req.params.menuId}

    if (!name || !inventory || !price) {
        return res.sendStatus(400)
    } else {
        db.run(sql, values, function(err) {
            if(err) {
                next(err)
            } else {
                db.get(`SELECT * FROM MenuItem WHERE id = $id`, {$id: this.lastID}, function(err, menuItem) {
                    if(err) {
                        next(err)
                    } else {
                        res.status(201).json({menuItem: menuItem})
                    }
                })
            }
        })
    }
})

//route param
menuItemRouter.param('menuItemId', (req, res, next, id) => {
    db.get(`SELECT * FROM MenuItem WHERE id = $id`, {$id: id}, (err, menuItem) => {
        if(err) {
            return res.sendStatus(404)
        } else if (menuItem) {
            req.menuItem = menuItem;
            next()
        } else {
            res.sendStatus(404)
        }
    })
})

//update menu item for one menu
menuItemRouter.put('/:menuItemId', (req, res, next) => {
    const {
        name,
        description,
        inventory,
        price
    } = req.body.menuItem;

    const sql = `UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE id = $id`;
    const values = {$id: req.params.menuItemId, $name: name, $description: description, $inventory: inventory, $price: price, $menuId: req.params.menuId}

    if (!name || !inventory || !price) {
        return res.sendStatus(400)
    } else {
        db.run(sql, values, (err) => {
            if(err) {
                next(err)
            } else {
                db.get(`SELECT * FROM MenuItem WHERE id = $id`, {$id: req.params.menuItemId}, (err, menuItem) => {
                    if(err) {
                        next(err)
                    } else {
                        res.status(200).json({menuItem: menuItem})
                    }
                })
            }
        })
    }

})

//delete menu item for one menu
menuItemRouter.delete('/:menuItemId', (req, res, next) => {
    db.run(`DELETE FROM MenuItem WHERE id = $id`, {$id: req.params.menuItemId}, (err) => {
        if(err) {
            next(err)
        } else {
            res.sendStatus(204)
        }
    })
})

module.exports = menuItemRouter;