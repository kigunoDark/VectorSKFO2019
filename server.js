const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const adminRoute = require('./routes/adminRoute');
const errControll = require('./controllers/errorController');
const sequelize = require('./data/database');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const handleAuth = require('./controllers/handlerauthentication');
// Зачища от csrf

// Для вывода ошибок через сессию
const flash = require('connect-flash');

// My models
const Team = require('./models/team');
const Role = require('./models/roles');
const User = require('./models/newUsers');
const Status = require('./models/status');





const fileFilter = (req,file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cb(null, false);
    }
 
}

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Math.random() + '-' + Date.now() +  '-' + file.originalname);
    }
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.disable('x-powered-by');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());


app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/images' ,express.static(path.join(__dirname, 'images')));

app.use(handleAuth)

app.use(flash());
app.use(async (req,res,next) => {
    try{
    res.locals.isAuthenticated = await req.session.isLoggedIn;
    res.locals.csrfToken = 'none';
    if(res.locals.isAuthenticated)
    {
        res.locals.userId = req.session.id;
        res.locals.name = req.session.name;
        res.locals.roleId = req.session.roleId;
        

    }
}catch{
    console.log('заебала эта поебота');
}
    next();
})


const landRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');
// APP.USE OF ROUTES

app.use(landRoute);
app.use('/admin', adminRoute);
app.use( authRoute);
app.use(errControll.get404);

// Role.belongsTo(Admin,{constraints: true, onDelete: 'CASCADE'} );
Role.hasOne(User,  {constraints: true, onDelete: 'CASCADE'});

User.belongsTo(Team, { constraints: false});
Team.hasMany(User, {constraints: false});
User.hasOne(Team, {constraints:false});
Team.belongsTo(User,{constraints: false});

Status.belongsTo(User,{ as: 'userinfo', foreignKey: { name: 'userId' }, constraints: false});
Status.belongsTo(Team,{ as: 'teaminfo', foreignKey: { name: 'teamId' }, constraints: false});
// TeamMate.belongsTo(Accepted, {constraints: true, onDelete: 'CASCADE'});


sequelize
.sync()
.then(admin => {
   if(!admin)
   {
     console.log("You need to create an admin")
   }
   return admin;
})
.then( () => {
   http.listen(8080, (err,next) => {
        if(err){
            console.log("Server is not working!");
        } else {
            console.log("Your server is running on a port 8080");
        }
    });

})
.catch(err => {
    console.log(err);
});

