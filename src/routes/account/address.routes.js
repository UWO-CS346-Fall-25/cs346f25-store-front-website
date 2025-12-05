
/* Addresses are removed from the app. Redirect any requests under
   `/account/addresses` back to the main account overview. */

const express = require('express');
const router = express.Router();

router.use((req, res) => {
  // Preserve original path in query for debugging if needed
  return res.redirect('/account');
});

module.exports = router;
