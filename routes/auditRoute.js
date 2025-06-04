const express = require('express');
const router = express.Router();

// GET route for the audit page
router.get('/', (req, res) => {

    // no dates oor contract numbers
    const sqlQuery = `
    SELECT 
    o.contract_number,
    COALESCE(SUM(o.order_price), 0) AS total_order_amount,
    COALESCE(i.total_invoice_amount, 0) AS total_invoice_amount,
    COALESCE(SUM(o.order_price), 0) - COALESCE(i.total_invoice_amount, 0) AS committed_cost,
    COALESCE(c.total_estimated_cost, 0) AS total_estimated_cost
FROM 
    tblOrders o
LEFT JOIN (
    SELECT 
        contract_number,
        SUM(invoice_price) AS total_invoice_amount
    FROM 
        tblInvoices
    GROUP BY 
        contract_number  -- Group by contract_number to sum all invoices under the contract
) i ON o.contract_number = i.contract_number  -- Join based on contract_number only
LEFT JOIN (
    SELECT 
        contract_number,
        SUM(estimated_cost) AS total_estimated_cost
    FROM 
        tblCategories
    GROUP BY 
        contract_number
) c ON o.contract_number = c.contract_number
GROUP BY 
    o.contract_number
ORDER BY 
    o.contract_number;
`;

global.db.all(sqlQuery, (err, rows) => {
    if (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
    }
    // console.log("Query executed successfully. Results:", rows);
    res.render('audit', { results: rows, error: null });
});
});

// POST route for filtering results
router.post('/filter/date', (req, res) => {
    const { startDate, endDate} = req.body;

    console.log("Start Date:", startDate); // Log start date
    console.log("End Date:", endDate); // Log end date?
    

 //dates
 const sqlQuery = `
SELECT 
    o.contract_number,
    o.category_name,
    o.latest_order_date,
    COALESCE(i.latest_invoice_date, '') AS latest_invoice_date,  -- Latest invoice date per category and contract
    COALESCE(i.total_invoice_amount, 0) AS total_invoice_amount,
    o.total_order_amount,
    o.total_order_amount - COALESCE(i.total_invoice_amount, 0) AS committed_cost,
    COALESCE(c.total_estimated_cost, 0) AS total_estimated_cost
FROM (
    SELECT 
        contract_number,
        category_name,
        MAX(date) AS latest_order_date,  -- Latest order date per category and contract
        SUM(order_price) AS total_order_amount  -- Total order amount per category and contract
    FROM 
        tblOrders
    WHERE 
        date BETWEEN ? AND ?  -- Date filter for orders
    GROUP BY 
        contract_number, category_name
) o
LEFT JOIN (
    SELECT 
        contract_number,
        category_name,
        MAX(date) AS latest_invoice_date,  -- Latest invoice date per category and contract
        SUM(invoice_price) AS total_invoice_amount  -- Total invoice amount per category and contract
    FROM 
        tblInvoices
    WHERE 
        date BETWEEN ? AND ?  -- Date filter for invoices
    GROUP BY 
        contract_number, category_name
) i ON o.contract_number = i.contract_number AND o.category_name = i.category_name  -- Join on contract_number and category_name
LEFT JOIN (
    SELECT 
        contract_number,
        category_name,
        SUM(estimated_cost) AS total_estimated_cost  -- Total estimated cost per category and contract
    FROM 
        tblCategories
    GROUP BY 
        contract_number, category_name
) c ON o.contract_number = c.contract_number AND o.category_name = c.category_name  -- Join with tblCategories on both contract_number and category_name
ORDER BY 
    o.category_name, o.contract_number;  -- Order by category name and contract number
`;

global.db.all(sqlQuery,  [startDate, endDate,startDate, endDate], (err, rows) => {
 if (err) {
     console.error(err.message);
     return res.status(500).send('Internal Server Error');
 }
 // console.log("Query executed successfully. Results:", rows);
 res.render('audit', { results: rows, error: null });
});  
  
});


// POST route for filtering results from contractNumber
router.post('/filter/contractNumber', (req, res) => {
    const { contractNumber} = req.body;

console.log("Contract Number: ",contractNumber);
    

 //Contract number and dates
 const sqlQuery = `
SELECT 
    o.contract_number,
    o.category_name,
    o.latest_order_date AS order_date,  -- Latest order date per category and contract
    COALESCE(i.latest_invoice_date, '') AS invoice_date,  -- Latest invoice date per category and contract
    COALESCE(i.total_invoice_amount, 0) AS total_invoice_amount,
    o.total_order_amount,
    o.total_order_amount - COALESCE(i.total_invoice_amount, 0) AS committed_cost,
    COALESCE(c.total_estimated_cost, 0) AS total_estimated_cost
FROM (
    SELECT 
        contract_number,
        category_name,
        MAX(date) AS latest_order_date,  -- Latest order date per category and contract
        SUM(order_price) AS total_order_amount  -- Total order amount per category and contract
    FROM 
        tblOrders
    GROUP BY 
        contract_number, category_name  -- Removed date from GROUP BY
) o
LEFT JOIN (
    SELECT 
        contract_number,
        category_name,
        MAX(date) AS latest_invoice_date,  -- Latest invoice date per category and contract
        SUM(invoice_price) AS total_invoice_amount  -- Total invoice amount per category and contract
    FROM 
        tblInvoices
    GROUP BY 
        contract_number, category_name  -- Group by contract number and category name only
) i ON o.contract_number = i.contract_number AND o.category_name = i.category_name  -- Join on contract_number and category_name
LEFT JOIN (
    SELECT 
        contract_number,
        category_name,
        SUM(estimated_cost) AS total_estimated_cost  -- Total estimated cost per category and contract
    FROM 
        tblCategories
    GROUP BY 
        contract_number, category_name  -- Group by contract_number and category_name
) c ON o.contract_number = c.contract_number AND o.category_name = c.category_name  -- Join with tblCategories on both contract_number and category_name
WHERE 
    o.contract_number = ?  -- Filter by contract number
ORDER BY 
    o.category_name;  -- Order by category name

`;

global.db.all(sqlQuery,  [contractNumber], (err, rows) => {
 if (err) {
     console.error(err.message);
     return res.status(500).send('Internal Server Error');
 }
 // console.log("Query executed successfully. Results:", rows);
 res.render('audit', { results: rows, error: null });
});  
  
});


// POST route for filtering results from categoryName
router.post('/filter/categoryName', (req, res) => {
    const { categoryName,startDate,endDate} = req.body;

    console.log("category Name: ",categoryName);
    console.log("Start Date:", startDate); // Log start date
    console.log("End Date:", endDate); // Log end date?
    

 //Contract number and dates
 const sqlQuery = `
SELECT 
    o.contract_number,
    o.category_name,
    o.latest_order_date AS order_date,  -- Latest order date per category and contract
    COALESCE(i.latest_invoice_date, '') AS invoice_date,  -- Latest invoice date per category and contract
    COALESCE(i.total_invoice_amount, 0) AS total_invoice_amount,
    o.total_order_amount,
    o.total_order_amount - COALESCE(i.total_invoice_amount, 0) AS committed_cost,
    COALESCE(c.total_estimated_cost, 0) AS total_estimated_cost
FROM (
    SELECT 
        contract_number,
        category_name,
        MAX(date) AS latest_order_date,  -- Latest order date per category and contract
        SUM(order_price) AS total_order_amount  -- Total order amount per category and contract
    FROM 
        tblOrders
    WHERE 
        date BETWEEN ? AND ?  -- Date filter for orders
        AND category_name = ?  -- Filter by category name
    GROUP BY 
        contract_number, category_name  -- Removed date from GROUP BY
) o
LEFT JOIN (
    SELECT 
        contract_number,
        category_name,
        MAX(date) AS latest_invoice_date,  -- Latest invoice date per category and contract
        SUM(invoice_price) AS total_invoice_amount  -- Total invoice amount per category and contract
    FROM 
        tblInvoices
    WHERE 
        date BETWEEN ? AND ?  -- Date filter for invoices
        AND category_name = ?  -- Filter by category name
    GROUP BY 
        contract_number, category_name  -- Group by contract number and category name
) i ON o.contract_number = i.contract_number AND o.category_name = i.category_name  -- Join on contract_number and category_name
LEFT JOIN (
    SELECT 
        contract_number,
        category_name,
        SUM(estimated_cost) AS total_estimated_cost  -- Total estimated cost per category and contract
    FROM 
        tblCategories
    GROUP BY 
        contract_number, category_name  -- Group by contract_number and category_name
) c ON o.contract_number = c.contract_number AND o.category_name = c.category_name  -- Join with tblCategories on both contract_number and category_name
ORDER BY 
    o.category_name;  -- Order by category name



`;

global.db.all(sqlQuery,  [startDate,endDate,categoryName,startDate,endDate,categoryName], (err, rows) => {
 if (err) {
     console.error(err.message);
     return res.status(500).send('Internal Server Error');
 }
 // console.log("Query executed successfully. Results:", rows);
 res.render('audit', { results: rows, error: null });
});  
  
});
// Export the router
module.exports = router;
