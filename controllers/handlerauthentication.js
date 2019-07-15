const User = require('../models/newUsers');

async function isLoggedIn (req,res, next) {
        req.session = {};
    try {
        res.session.user = {};
        let user = await User.findOne({
            where: { cookie : req.cookies.vector}
        });
        console.log(user);
         req.session.user.id= user.id;
         req.session.isLoggedIn = true;
         req.isLoggedIn = true;
    } catch (error) {
        req,isLoggedIn = true;
         req.session.isLoggedIn = false;
    }
    
    next();
};

module.exports = isLoggedIn;