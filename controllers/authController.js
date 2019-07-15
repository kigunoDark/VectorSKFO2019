const TeamMate = require('../models/team');

const bcrypt = require('bcryptjs');
const User = require('../models/newUsers');
const crypto = require('crypto');
const sizeOf = require('image-size');
const {validationResult } = require('express-validator/check');
const uuid = require('uuidv4');
const sendgridTransport= require('nodemailer-sendgrid-transport');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: process.env.SENDGRID_API_KEY
    }
}));


exports.postSignUp = async (req,res) => {
    const cookie = crypto.createHmac('sha256', 'SEALS')
            .update(uuid())
            .digest('hex');

    const csrf = uuid();
    const name = req.body.name;
    const surname = req.body.surname;
    const secondname = req.body.secondname;
    const city = req.body.city;
    const univercity = req.body.univercity;
    const email = req.body.email;
    const phone = req.body.phone;
    const date = req.body.date;
    const social = req.body.social;
    const position = req.body.position;
    const exp = req.body.exp;
    const socityExp = req.body.socityExp;
    const eventsExp = req.body.eventsExp;
    const character = req.body.character;
    const strengths = req.body.strengths;
    const why = req.body.why;
    const size = req.body.size;
    const password = req.body.password;
    const photo = req.file;
    const roleId = req.body.roleId;
    const status = 'Заявка рассматривается'
    const teamStatus = 'Команды нет';
    const errors = validationResult(req);

    if(!photo)
    {
        console.log(" you didn't get the data");
        res.redirect('/');
    }

    const imageUrl = photo.path;
    var dimensions = sizeOf(imageUrl);
   
    // if(dimensions.height != dimensions.width || dimensions.height > 800 || dimensions.width > 800 )
    // {
    //     req.flash('errors', 'Ширина и высота изображения должны быть одинаковы и не меньше 800px')
    //     console.log('Ошибка с картинкой');
    //     return res.redirect('/');
    // }
    
    if(!errors.isEmpty()){
        
        User.findAll()
        .then(users => {
        return  res.status(422).render('./users/landingPage',{
            users: users,
            pageTitle: "ВекторСКФО",
            pageTipe: "users",
            editing: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name: name,
                surname: surname,
                secondname: secondname,
                city: city,
                univercity:univercity,
                email: email,
                phone: phone,
                date: date,
                social: social,
                position: position,
                exp: exp,
                socityExp: socityExp,
                eventsExp: eventsExp,
                character: character,
                strengths: strengths,
                why: why,
                size: size,
                photo: photo,
                roleId:  roleId,
              
            },
            validationErrors: errors.array()
            
       });
    })
    .catch(err => {
        console.log(err);
    })
    }
    User.findOne({where: {email: email}})
    .then(userDoc =>{
        if(userDoc){
            res.redirect('/')
            return Promise.reject(
                'Данный email адресс уже занят другим пользователем.'
            )
        } else {
            bcrypt
            .hash(password, 12)
            .then(hashedPassword => {
                const user = new User({
                    name: name,
                    surname: surname,
                    secondname: secondname, 
                    city: city,
                    univercity: univercity,
                    email: email,
                    phone: phone,
                    date: date,
                    social: social,
                    position: position,
                    exp: exp,
                    socityExp: socityExp,
                    eventsExp: eventsExp,
                    character: character,
                    strengths: strengths,
                    why: why,
                    size: size,
                    photo: imageUrl,
                    password: hashedPassword,
                    roleId: roleId,
                    status: status,
                    teamStatus: teamStatus,
                    cookie,
                    csrf
                   
                });
                return user.save();
            }) 
            .then(result => {
                res.cookie('vector',cookie, { maxAge:86400000, httpOnly: true });
                res.redirect('/user-login');
               return transporter.sendMail({
                    to: email,
                    from: 'kiguno1996@gmail.com',
                    subject: 'Поздравляем, вы прошли первый этап регистрации "ВекторСКФО',
                    html: '<h1 Команда вектор ждет тебя!!! </h1>',
                    html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;"> Добрый день. Сейчас вы зарегестрировались участник. Если у вас есть команда вы можете найти ее в списке и присоединиться к ней, также вы можете создать команду и пригласить в нее участников. </p>'
                }); 
            })
            .catch(err=> {
                console.log(err);
        })
        }
    })
    
      
}



exports.getUserLogin = (req, res)  => {
 
if(!req.session.isLoggedIn)
{   res.render('./admin/mobile-login',
    {   name: '',
        pageTitle: "ВЕКТОР АДМИН",
        pageTipe:"mobileLogin",
        isAuthenticated: req.isLoggedIn,
        userId: req.id
    })

} else {
    res.redirect('/profile');
}
    
}

exports.postLogin = (req, res) => {
    const email= req.body.adminEmail;
    const password = req.body.adminPassword;  

    User.findOne({where: {email: email }})
    .then(user=> {
        if(!user)
        {
            req.flash('error', 'Проверьте email или пароль.');
            return res.redirect('/user-login');
        }
        bcrypt
        .compare(password, user.password)
        .then(doMatch => {
            if(doMatch){
                res.cookie('vector',user.cookie, { maxAge:86400000, httpOnly: true });
                return res.redirect('/profile');
                    
            } else {
              res.redirect('/user-login');
            }   
        })
        .catch(err => {
            console.log(err);
            res.redirect('/user-login');
        });
    })
}
        


exports.postLogout  = (req, res, next) => {
        
    res.clearCookie('vector');      
    res.redirect('/user-login');
        
}

