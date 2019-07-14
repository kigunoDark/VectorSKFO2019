const User = require('../models/users');

async function isLoggedIn (req,res, next) {
        req.locals = {};
    try {
        let user = await User.findOne({
            where: { cookie : req.cookies.seals}
        });
         req.session.name = user.name;
         req.session.avatar = user.avatar;
         req.session.id = user.id;
         req.session.isLoggedIn = true;
         req.session.email = user.email;
         req.session.phone = user.phone;
         req.session.link = user.link;
         req.session.score = user.score;
    } catch (error) {
         req.session.isLoggedIn = false;
    }
    
    next();
};

module.exports = isLoggedIn;