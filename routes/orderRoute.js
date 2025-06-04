const express = require('express');
const router = express.Router();

// GET route to render the order form with contract numbers
router.get('/', (req, res) => {
    const sqlQuery = `SELECT contract_number FROM tblProjects`;

    global.db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        const contractNumbers = rows.map(row => row.contract_number);
        res.render('orders', { contractNumbers: contractNumbers, searchResults: [] });
    });
});

router.post('/add', (req, res) => {
    const { contract_number, category_name, supplier, order_number, date, order_price } = req.body;

    const insertQuery = `
    INSERT INTO tblOrders (
        contract_number,
        category_name,
        order_number,
        date,
        order_price,
        supplier
    ) VALUES (?, ?, ?, ?, ?, ?);
    `;

    global.db.run(insertQuery, [contract_number, category_name, order_number, date, order_price, supplier], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                // Send a custom error message to the client if the UNIQUE constraint fails
                return res.status(400).json({ error: 'You cannot have a duplicate order number on the same contract.' });
            } else {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        }

        const updateQuery = `UPDATE tblOrders SET unique_order_id = order_id || '-' || order_number WHERE unique_order_id IS NULL;`;
        global.db.run(updateQuery, function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Respond with success message and any necessary data (like the new order's ID)
            return res.status(201).json({ success: true, message: 'Order added successfully', order_number: order_number });
        });
    });
});






// POST route for searching orders by order number
router.post('/search', (req, res) => {
    const { order_number } = req.body;

    const sqlSearch = `
        SELECT 
            order_id,
            contract_number,
            category_name,
            supplier,
            order_number,
            order_price,
            date
        FROM tblOrders
        WHERE order_number = ?`;

    global.db.all(sqlSearch, [order_number], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        const contractNumbers = [];
        global.db.all("SELECT contract_number FROM tblProjects", [], (err, contracts) => {
            if (err) return res.status(500).send('Internal Server Error');

            contracts.forEach(row => contractNumbers.push(row.contract_number));

            res.render('orders', {
                contractNumbers: contractNumbers,
                searchResults: rows // Send search results to the template
            });
        });
    });
});

// POST route for editing an existing order
router.post('/edit', (req, res) => {
    const { order_number_edit, category_name_edit, order_price_edit,supplier_edit,order_id } = req.body;

    const sqlUpdate = `
        UPDATE tblOrders 
        SET category_name = ?, order_price = ?,order_number=?,supplier=?
        WHERE order_id = ?`;

    global.db.run(sqlUpdate, [category_name_edit, order_price_edit, order_number_edit,supplier_edit,order_id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }else {
            const updateQuery = `UPDATE tblOrders SET unique_order_id = order_id || '-' || order_number`;
            global.db.run(updateQuery, function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Internal Server Error');
                }
                // Redirect or send a success message
                res.redirect('/order');
            });
        }
    });
});

module.exports = router;
