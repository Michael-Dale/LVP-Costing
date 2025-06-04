const express = require('express');
const router = express.Router();

// GET route for the project page
router.get('/', (req, res) => {
    res.render('project', { message: null });
});

// GET route to fetch all project numbers
router.get('/get-all', (req, res) => {
    const sqlQuery = `SELECT contract_number FROM tblProjects`;

    global.db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});

// POST route for adding a new project
router.post('/add', (req, res) => {
    const { contract_number, contract_description } = req.body;

    // Validate inputs
    if (!contract_number || !contract_description) {
        return res.status(400).send('Contract number and description are required.');
    }

    const sqlQuery = `
        INSERT INTO tblProjects (contract_number, contract_description)
        VALUES (?, ?);
    `;

    global.db.run(sqlQuery, [contract_number, contract_description], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }
        console.log(`Project added with contract number: ${contract_number}`);
        res.render('project', { message: 'Project added successfully!' });
    });
});

// Export the router
module.exports = router;
