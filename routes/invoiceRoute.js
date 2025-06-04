const express = require('express');
const router = express.Router();

// GET route to render the invoice form
router.get('/', (req, res) => {
    // Query to fetch contract numbers from tblProjects
    const sqlQuery = `SELECT contract_number FROM tblProjects`;

    global.db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }
        
        // Map the contract numbers to an array
        const contractNumbers = rows.map(row => row.contract_number);

        // Render the form with contract numbers and empty search results initially
        res.render('invoice', { contractNumbers: contractNumbers, results:[], error: null });
    });
});

// POST route to handle adding a new invoice
router.post('/add', (req, res) => {
    const { invoice_number, date, invoice_price, contract_number, category_name,  order_id} = req.body;

    const sqlQuery = `
    INSERT INTO tblInvoices (
        invoice_number,
        date,
        invoice_price,
        contract_number,
        category_name,
        unique_order_id
    ) VALUES (?, ?, ?, ?, ?,?)`;

    global.db.run(sqlQuery, [invoice_number, date, invoice_price, contract_number, category_name, order_id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }
        
        // Redirect or send a success message
        res.redirect('/invoice'); // Redirect back to the invoice page after insertion
    });
});

// GET route for searching orders by contract number
router.get('/search', (req, res) => {
    const { contract_number } = req.query;

    // Query to fetch contract numbers for the dropdown
    const contractQuery = `SELECT contract_number FROM tblProjects`;
    global.db.all(contractQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        const contractNumbers = rows.map(row => row.contract_number);

        // Query to search orders by contract_number
        const searchQuery = `
            SELECT o.contract_number, 
           o.category_name, 
           o.supplier, 
           o.order_number, 
           o.order_price, 
           o.date, 
           o.unique_order_id, 
           (SELECT GROUP_CONCAT(i.invoice_number) 
            FROM tblInvoices i 
            WHERE i.unique_order_id = o.unique_order_id) AS invoice_numbers,
           (o.order_price - IFNULL(
               (SELECT SUM(i.invoice_price) 
                FROM tblInvoices i 
                WHERE i.unique_order_id = o.unique_order_id), 0)
           ) AS remaining_balance
    FROM tblOrders o 
    WHERE o.contract_number = ?`;

        global.db.all(searchQuery, [contract_number], (err, rows) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }

                // Render the page with contract numbers, search results, and invoice search results
                res.render('invoice', { contractNumbers: contractNumbers, results: rows, error: null});
        });
    });
});

// GET route to search invoices by contract number
router.get('/searchInvoices', (req, res) => {
    const { contract_number } = req.query;

    // Query to fetch contract numbers for the dropdown
    const contractQuery = `SELECT contract_number FROM tblProjects`;
    global.db.all(contractQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        const contractNumbers = rows.map(row => row.contract_number);

        // Query to search invoices by contract_number
        const invoiceSearchQuery = `
        SELECT tblInvoices.invoice_number, tblInvoices.invoice_id, tblInvoices.date, 
               tblInvoices.invoice_price, tblInvoices.contract_number, 
               tblInvoices.category_name, tblOrders.order_number
        FROM tblInvoices
        JOIN tblOrders ON tblInvoices.unique_order_id = tblOrders.unique_order_id
        WHERE tblInvoices.contract_number = ?`;

        global.db.all(invoiceSearchQuery, [contract_number], (err, rows) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }

            // Render the page with contract numbers, search results, and invoice search results
            res.render('invoice', {contractNumbers: contractNumbers, results: rows, error: null});
        });
    });
});

// POST route to update an existing invoice
router.post('/update', (req, res) => {
    const { invoice_id, invoice_number_edit, invoice_price_edit, contract_number_edit, category_name_edit, date_edit } = req.body;

    const sqlQuery = `
        UPDATE tblInvoices 
        SET invoice_number = ?, invoice_price = ?, contract_number = ?, category_name = ?, date = ? 
        WHERE invoice_id = ?`;

    global.db.run(sqlQuery, [invoice_number_edit, invoice_price_edit, contract_number_edit, category_name_edit, date_edit, invoice_id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        // Redirect to the invoice page or show a success message
        res.redirect('/invoice');
    });
});


// Export the router
module.exports = router;
