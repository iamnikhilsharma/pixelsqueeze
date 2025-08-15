const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

router.use(authenticateToken, requireAdmin);

// GET /api/admin/subscriptions - list subs excluding free
router.get('/', async (req,res)=>{
  const subs = await User.find({ 'subscription.plan': { $ne: 'free' } })
    .select('email firstName lastName subscription');
  res.json({ success:true, data: subs });
});

// PATCH /api/admin/subscriptions/:id/cancel - set status canceled
router.patch('/:id/cancel', async (req,res)=>{
  const user = await User.findById(req.params.id);
  if(!user) return res.status(404).json({ success:false, message:'User not found' });
  user.subscription.status = 'canceled';
  user.subscription.cancelAtPeriodEnd = true;
  await user.save();
  res.json({ success:true, data: user.subscription });
});

module.exports = router;
