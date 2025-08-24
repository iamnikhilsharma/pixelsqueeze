const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

router.use(authenticateToken, requireAdmin);

// Dummy list: scan invoices directory if exists
router.get('/', (req,res)=>{
  const dir = path.join(__dirname, '../../invoices');
  let files=[];
  if(fs.existsSync(dir)) files = fs.readdirSync(dir).filter(f=>f.endsWith('.pdf'));
  const data = files.map(f=>({ filename:f, url:`/invoices/${f}` }));
  res.json({ success:true, data });
});

module.exports = router;
