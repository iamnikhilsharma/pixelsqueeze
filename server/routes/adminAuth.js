const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ error:'Validation error', details: errors.array()});
  const { email, password } = req.body;
  try{
    const user = await User.findByEmail(email);
    if(!user || !user.isAdmin) return res.status(401).json({ error:'Admin credentials required'});
    const ok = await user.comparePassword(password);
    if(!ok) return res.status(401).json({ error:'Invalid credentials'});
    const token = user.generateAuthToken();
    res.json({ success:true, data:{ token, user:{ id:user._id, email:user.email, isAdmin:true }}});
  }catch(err){
    res.status(500).json({ error:'Login error'});
  }
});

module.exports = router;
