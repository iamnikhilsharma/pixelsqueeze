const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const pricing = require('../../shared/pricing');

router.use(authenticateToken, requireAdmin);

// GET all plans
router.get('/', (req,res)=>{
  return res.json({ success:true, data: pricing.getAllPlans() });
});

// PATCH update plan price { monthly, annual }
router.patch('/:id', (req,res)=>{
  const { id } = req.params;
  const { monthly, annual } = req.body;
  const plan = pricing.getPlanById(id);
  if(!plan) return res.status(404).json({ success:false, message:'Plan not found' });
  if(monthly!=null) plan.price.monthly = Number(monthly);
  if(annual!=null) plan.price.annual = Number(annual);
  return res.json({ success:true, data: plan });
});

module.exports = router;
