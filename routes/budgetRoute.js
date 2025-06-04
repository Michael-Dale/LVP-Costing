const express = require('express');
const router = express.Router();

// GET route to render the budget form
router.get('/', (req, res) => {
    const sqlQuery = `SELECT contract_number FROM tblProjects`;

    global.db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        const contractNumbers = rows.map(row => row.contract_number);
        res.render('budget', { contractNumbers: contractNumbers, message: null, searchResults: [] });
    });
});

// POST route for adding a new category
router.post('/add', (req, res) => {
    const { category_name, estimated_cost, contract_number } = req.body;

    const sqlInsert = `
        INSERT INTO tblCategories (category_name, estimated_cost, contract_number)
        VALUES (?, ?, ?)`;

    global.db.run(sqlInsert, [category_name, estimated_cost, contract_number], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/budget'); // Redirect back to the budget page after adding
    });
});

// POST route for searching budgets
router.post('/search', (req, res) => {
    const { contract_number } = req.body;

    const sqlSearch = `
        SELECT 
            category_id,
            category_name,
            estimated_cost,
            contract_number
        FROM tblCategories
        WHERE contract_number = ?`;

    global.db.all(sqlSearch, [contract_number], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        const contractNumbers = [];
        global.db.all("SELECT contract_number FROM tblProjects", [], (err, contracts) => {
            if (err) return res.status(500).send('Internal Server Error');

            contracts.forEach(row => contractNumbers.push(row.contract_number));

            res.render('budget', {
                contractNumbers: contractNumbers,
                message: null,
                searchResults: rows // Send search results to the template
            });
        });
    });
});


// POST route for editing estimated cost
router.post('/edit', (req, res) => {
    const { category_name_edit, estimated_cost_edit, category_id } = req.body;

    const sqlUpdate = `
        UPDATE tblCategories 
        SET estimated_cost = ?, category_name = ?
        WHERE category_id = ?`;

    global.db.run(sqlUpdate, [estimated_cost_edit, category_name_edit, category_id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/budget');
    });
});


module.exports = router;
