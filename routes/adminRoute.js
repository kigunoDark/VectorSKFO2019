const express = require('express');
const router = express.Router();
const adminControll = require('../controllers/adminControll');

router.get('/login', adminControll.getAdminLogin);
router.get('/adminPage',adminControll.getAdminPage);

module.exports = router;