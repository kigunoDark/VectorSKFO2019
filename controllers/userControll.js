const User = require('../models/users');
const Role = require('../models/roles');
const Status = require('../models/status');
const Team = require('../models/team');
const sizeOf = require('image-size');
const moment = require('moment');
const {validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const sendgridTransport= require('nodemailer-sendgrid-transport');
const nodemailer = require('nodemailer');
const fileHelper = require('../util/file');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: process.env.SENDGRID_API_KEY
    }
}));


exports.getLanding = async (req, res) => {
    if(!req.session.isLoggedIn)
    {
    const userStatus = "Участник";
    let message = req.flash('error');
    if(message.length > 0)
    {
        messege = message[0];
    } else {
        message = null;
    }

    try { 
        const teams = await  Team.findAll()
        res.render('./users/landingPage',
        {   
            userStatus:userStatus,
            teams: teams,
            pageTitle: "ВекторСКФО",
            pageTipe:"users",
            path: '/',
            errorMessage: message,
            oldInput: {
                parFio:'',
                parCity:'',
                parUnivercity:'',
                parEmail:'',
                parPhone:'',
                parDate:'',
                parSocial:'',
                parPosition:'',
                parExp:'',
                parSocityExp:'',
                parEventsExp:'',
                parCharacter:'',
                parStrengths:'',
                parWhy:'',
                parSize:'',
                parPhoto:''
            },
            validationErrors:[]
            
        });
    } catch(err) {
        if(err)
        {
            console.log(err);
        } else {
            console.log('Success!');
        }
    }
} else {
    res.redirect('/profile');
}
    
}

exports.postSignUp = async (req,res) => {
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
                    teamStatus: teamStatus
                   
                });
                return user.save();
            }) 
            .then(result => {
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


exports.getMainPage = async (req,res) => {

        const userId = req.session.user.id;
        const teamId = req.session.user.teamId;
     
    try {
      const user = await User.findById(userId)    
            res.render('./users/profile-page',{
                userId:userId,
                user: user,
                teamId: teamId,
                moment: moment,
                pageTitle: `${user.name + " " + user.surname}`,
                pageTipe: "adminIn"

            })  
    } catch (err) {
        if(err)
        {
            console.log(err);
        } else {
            console.log('Success!!!');
        }
    }      
}

exports.getEditUser = async (req, res, next) => {

    let message = req.flash('error');
    const userId = req.params.id;
    const editMode = req.query.edit;

    if(message.length > 0)
    {
        messege = message[0];
    } else {
        message = null;
    }

    if(!editMode){
        return res.redirect('/');
    }
   try {
   const user = await User.findById(userId)
        if(!user)
        {
            return res.redirect('/')
        }
        res.render('./users/edit-user',{
            pageTitle: "Изменение профиля",
            pageTipe: 'adminIn',
            user: user,
            editing: editMode,
            errorMessage: message,
            validationErrors:[]
         
        })
    } catch(err) {

        if(err)
        {
            console.log(err);
        } else {
            console.log('Success!!');
        }
    }
        
};

exports.postEditUser = (req, res, next) => {

    const updatedName= req.body.name;
    const updatedSurname = req.body.surname;
    const updatedSecondName = req.body.secondname;
    const updatedEmail = req.body.email;
    const updatedDate = req.body.date;
    const updatedCity = req.body.city;
    const updatedSocial = req.body.social;
    const updatedPosition = req.body.position;
    const updatedPhone = req.body.phone;
    const updatedUnivercity = req.body.univercity;
    const updatedSocialExp = req.body.socityExp;
    const updatedSize = req.body.size;
    const updatedExp = req.body.exp;
    const updatedEventsExp = req.body.eventsExp;
    const updatedCharacter = req.body.character;
    const updatedStrengths = req.body.strengths;
    const updatedWhy = req.body.why;
    const userId = req.body.userId;
    const updatedPhoto = req.file;

    
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return  res.status(422).render('./admin/edit-teammate',{
            pageTitle: "Изменение Cотрудника",
            pageTipe: "adminIn",
            editing: true,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                mateSurname: updatedMateSurname,
                mateName: updatedMateName,
                mateSecondName: updatedMateSecondName,
                matePosition: updatedMatePosition,
                mateVk: updatedMateVK,
                mateInstagram: updatedMateInstagram,
                matePhone: updatedMatePhone,
                mateAbout: updatedMateAbout,
                mateCrowns: updatedMateCrowns,
                mateHobby: updatedMateHobby ,
                mateEmail: updatedMateEmail,
                matePhoto: updatedPhoto
            },
            validationErrors: errors.array()

        });
    }
   User.findById(userId)

   .then(user=>{
       user.name = updatedName;
       user.surname = updatedSurname;
       user.secondname = updatedSecondName;
       user.Date = updatedDate;
       user.why = updatedWhy;
       user.size = updatedSize;
       user.city = updatedCity;
       user.univercity = updatedUnivercity;
       user.email = updatedEmail;
       user.social = updatedSocial;
       user.position = updatedPosition;
       user.phone = updatedPhone;
       user.socityExp = updatedSocialExp;
       user.exp = updatedExp;
       user.character = updatedCharacter;
       user.eventsExp = updatedEventsExp;
       user.strengths = updatedStrengths;
       req.session.user.name = updatedName;
       
       if(updatedPhoto){
           fileHelper.deleteFile(user.photo);
          user.photo = updatedPhoto.path;
       }
       return user.save();
   })
   .then(retult =>{
       console.log('Updated product');
       res.redirect('/profile');
   })
   .catch(err => console.log(err));

}

exports.getEditTeam = async (req, res) => {


    let message = req.flash('error');
    const editMode = req.query.edit;
    const teamId = req.params.id;

    if(message.length > 0)
    {
        messege = message[0];
    } else {
        message = null;
    }
 
    if(!editMode){
        return res.redirect('/');
    }

    try { 

    const team = await Team.findById(teamId)

        if(!team)
        {
            return res.redirect('/')
        }
        res.render('./users/add-team',{
            pageTitle: "Изменение профиля команды",
            pageTipe: 'adminIn',
            team:team,
            editing: editMode,
            errorMessage: message,
            oldInput: {
                t_name:'',
                t_social:'',
                t_exp:'',
                t_str:'',
                t_imp:'',
                t_why:'',
                t_size:'',
                photo:''
            },
            validationErrors:[]
         
        })

    } catch(err) {
        
        if(err)
        {
            console.log(err);
        } else {
            console.log('Success!');
        }
    }
        
   
};

exports.postEditTeam = (req, res, next) => {

    const teamId = req.body.teamId;
    const t_name = req.body.t_name;
    const t_social = req.body.t_social;
    const t_exp = req.body.t_exp;
    const t_str = req.body.t_str;
    const t_imp = req.body.t_imp;
    const t_why = req.body.t_why;
    const t_size = req.body.t_size;
    const photo = req.file;

    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return  res.status(422).render('./users/edit-team',{
            pageTitle: "Редактирование профиля команды",
            pageTipe: "adminIn",
            editing: true,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                t_name:t_name,
                t_social:t_social,
                t_exp:t_exp,
                t_str:t_str,
                t_imp:t_imp,
                t_why:t_why,
                t_size:t_size,
                photo:photo
            },
            validationErrors: errors.array()
        });
    }
   Team.findById(teamId)
   .then(team=>{
       team.t_name = t_name;
       team.t_social = t_social;
       team.t_exp = t_exp;
       team.t_str = t_str;
       team.t_imp = t_imp;
       team.t_why = t_why;
       team.t_size = t_size;

       if(photo){
           fileHelper.deleteFile(team.photo);
           team.photo = photo.path;
       }
       return team.save();
   })
   .then(retult =>{
       console.log('Updated product');
       res.redirect('/teams-page');
   })
   .catch(err => console.log(err));

}

exports.getUser = async (req,res, next)  => {

   const id = req.params.id;

   try {
   const user = await User.findById(id)

        if(!user){
            res.redirect('/');
        }
        res.render("./admin/user-details", {
            moment: moment,
            user: user,
            pageTitle: "Профиль пользователя",
            pageTipe: "adminIn",
            path: "/admin/userDetails"
        })

    } catch(err) {
        if(err)
        {
            console.log(err);
        } else {
            console.log("Success!");
        }
    }
   
}

exports.getAddTeamPage =  async (req, res ) => {

    const userId = req.session.user.id;

    try {
        
        const user = await User.findById(userId)

            res.render("./users/add-team", {
                pageTitle: "Создать команду",
                editing: false,
                pageTipe: "adminIn",
                roleId: user.roleId,
                oldInput: {
                    t_name:'',
                    t_social:'',
                    t_exp:'',
                    t_str:'',
                    t_imp:'',
                    t_why:'',
                    t_size:'',
                    photo:''
                }
            })

    } catch(err) {
        
        if(err)
        {
            console.log(err);
        } else {
            console.log("Success!");
        }
    }
}

exports.getTeamsPage = async (req, res) => {

    const userId = req.session.user.id;
    let teamStatus = '';
    User.findById(userId)
    .then(user => 
        {
            teamStatus = user.teamStatus;
        }
    )

    try { 

    const status = await Status.findOne({where:{userId:userId}})
    
        const user = await User.findOne({where:{id:userId}})

            const teams = await Team.findAll()
        
            res.render('./users/teams-page', {
                s_type: user.s_type, 
                status:status, 
                userId:userId,
                teams: teams,
                user: user,
                teamStatus:teamStatus,
                pageTitle: "Команды участников",
                pageTipe: "adminIn"
            })
    
        } catch(err) {

            if(err)
            {
                console.log(err);
            } else {
                console.log("Success!");
            }

        }
 

   
}


exports.postAddTeam = (req, res) => {
    const userId = req.session.user.id;
   
    const roleID = 4;
    // req.session.user.roleId = roleID;
 
        const t_name = req.body.t_name;
        const t_social = req.body.t_social;
        const t_exp = req.body.t_exp;
        const t_str = req.body.t_str;
        const t_imp = req.body.t_imp;
        const t_why = req.body.t_why;
        const t_size = req.body.t_size;
        const photo = req.file;

        User.findOne({where: {id: userId }})
        .then( user => {
            if(user)
            {
                user.update({
                    roleId:roleID,
                    teamStatus: 'Лидер команды'
                
                })
                .then(() => {
                    console.log('Все проапдейтилось!!')
                })
            }
        })
     
        if(!photo)
        {
            console.log(" Мы не получили данных где хранится файл");
            res.redirect('/add-team');
        }
        const imageUrl = photo.path;
       
       
        Team.create({
            t_name: t_name,
            t_social: t_social,
            t_exp: t_exp,
            t_str: t_str,
            t_imp: t_imp,
            t_why: t_why,
            t_size: t_size,
            photo: imageUrl,
            userId: userId
            
        })
        .then(team => {
        const userId = req.session.user.id;
        console.log('Это иди команды ' + team.id);
        console.log('Это иди пользователя ' + userId);
        if(team.userId === userId)
        {
            User.findById(userId)
            .then( user => {
                if(user)
                {
                    
                    return user.update({
                        teamId: team.id
                    
                    })
                    .then(() => {
                        console.log('Команда присоединена к юзеру')
                    })
                }
            })
        }
            res.redirect('/teams-page');
           return transporter.sendMail({
                to: userEmail,
                from: 'kiguno1996@gmail.com',
                subject: 'Вы создали свою команду для "ВекторСКФО',
                html: '<h1 Команда вектор ждет тебя!!! </h1>',
                html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;"> Добрый день. Команда "Вектор" хотела бы уведомить вас о том, что вы являетесь лидером новой команды заявка которой будет рассматриваться. Просим вас сообщить вашим ребятам о том, что они могут вступить в нее или пригласить их сами. </p>'
            }); 
        })
      .catch( err => {
            console.log(err);
        });
}

exports.getListOfUsers = async (req, res) => { 

    const activeUserId = req.session.user.id;

    try {

        const users = await User.findAll()
        for(let i = 0; i < users.length; i ++)
        {
            if(users[i].id === activeUserId)
            {
                let middle = users[i];
                users[i] = users[0];
                users[0] = middle;
            }
        }
        
        res.render('./users/users-page', {
            activeUserId:activeUserId,
            users: users,
            pageTitle: "Список всех участников без команды",
            pageTipe: "adminIn"
        })
        
    } catch(err) {
        
        if(err)
        {
            console.log(err);
        } else {
            console.log("Success!");
        }
    }

}

exports.getUserDetails = async (req,res) => {

    const userId = req.params.id;
    const activeUserId = req.session.user.id;
    const roleId = req.session.user.roleId;

    const user = await User.findById(userId)
    
        res.render('./users/user-details',
        { 
            activeUserId: activeUserId,
            pageTitle: "Профиль участника",
            pageTipe: 'adminIn',
            user: user,
            roleId:roleId,
            moment:moment
        })
 }


 exports.getTeamDetails= (req,res, next) => {
    const teamId = req.params.id;
    const name = req.session.user.name;
    const activeUserId = req.session.user.id;
        Team.findOne( {include:{
            model: User,
            where: {teamId:teamId}
        }}).then(team => {
            Status.findAll({where: {teamId: teamId}})
            .then(statuses => {
            
            const t = team;
            res.render('./users/team-details',
            { 
                statuses: statuses,
                name: name,
                activeUserId: activeUserId,
                pageTitle: "Профиль участника",
                pageTipe: 'adminIn',
                team: t,
                users: t.users,
                moment:moment
            })

        })
    })
        .catch(err => {
            console.log(err);
        })
 }
 
exports.postAddRequest = (req, res) => {
   console.log("i've got a request");
   const userId = req.session.user.id;
   const teamId = req.body.teamId;
   console.log(teamId);

   const userEmail = req.session.user.email; 
   
   User.findById(userId)
   .then(user => {
       user.teamStatus = "Заявка подана";
       return user.save()
       .then(err => {
           console.log("This is an error of requesting: " + err);
       })
       .then(() => {
            Status.create({
                userId:userId,
                accepted: false,
                teamId: teamId      
            })
            .then(()=> {
            res.redirect('/teams-page');
            return transporter.sendMail({
                to: userEmail,
                from: 'kiguno1996@gmail.com',
                subject: 'Вы  подали заявку в  команду',
                html: '<h1 Команда вектор ждет тебя!!! </h1>',
                html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;"> Добрый день. Команда "Вектор" хотела бы вас уведомить о том, что вы подали заявку на вступление в команду. В ближайшее время вашу заявку рассмотрит лидер команды и примет решение. На забудьте проверять свой профиль и почту чтобы видеть свой статус. </p>'
            }); 
            
            })
            .catch( err => {
                        
                if(err){
                    console.log(err);
                } else {
                    console.log('Вы успешно подали заявку в команду')
                }
            
            })
        })
   })
   .catch(err => {
       console.log(err);
   })
   
  
}  

// Отмена вступления в команду
exports.postCancelRequest = (req, res) => {
    console.log("i've got a request");
    let userId = req.session.user.id;
    const userEmail = req.session.user.email;
    
    User.findById(userId)
    .then(user => {
        
       
        user.teamId = 0;
        user.teamStatus = 'Команды нет'
        return user.save()
        .catch(err => {
            console.log('This is error of conceletion: ' + err);
        })
    }).then(() => {
        Status.destroy({
            where: {userId: userId }
        })
        .then(() => {
                    res.redirect('/teams-page');
                    return transporter.sendMail({
                         to: userEmail,
                         from: 'kiguno1996@gmail.com',
                         subject: 'Вы отклонили заявку в команду',
                         html: '<h1 Команда вектор ждет тебя!!! </h1>',
                         html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;"> Добрый день. Команда "Вектор" хотела бы уведомить вас о том, что вы являетесь лидером новой команды заявка которой будет рассматриваться. Просим вас сообщить вашим ребятам о том, что они могут вступить в нее или пригласить их сами. </p>'
                     }); 
                })
                .catch(err => {
                    if(err)
                    {
                        console.log(err);
                    } else {
                        console.log('Вы успешно отменили заявку в команду!!')
                    }
                })

    })
   
            req.session.user.teamId = 0;   
}

exports.declineAllRequests = (req, res) => {
    console.log('a good effort bro');
    const userId = req.session.user.id;
    let teamId = '';
    User.findById(userId)
    .then(user => {
        teamId = user.teamId;
    })
    .then(() => {
        Status.findAll({where: {teamId:teamId}})
        .then(statuses => {
            for(let i = 0 ; i< statuses.length; i++ )
            {
                console.log('This is a stauts id: ' + statuses[i].userId);
                User.findOne({where: {id: statuses[i].userId }})
                .then(user => {
                    console.log('This is your userId ' + user.name + " team status " + user.teamStatus);
                    user.update({
                        teamStatus:'Команды нет'
                    })
    
                })
            }
           
        })
        Status.destroy({where: {teamId: teamId}})
        .then(() => {
            res.redirect('/team-requests');
        })
    }) 
} 

exports.postInviteTeammate = (req, res) => { 
    let leaderId = req.session.user.id;
    const teamMateId = req.body.teamMateId;
    let teamId = '';
    let teamsId = [];
    User.findById(leaderId)
    .then(leader =>{ 

        teamId = leader.teamId;
        console.log("This is a  teamID: " + leader.teamId)
        User.findById(teamMateId)
        .then(user => {
        
            
            teamsId[0] = user.eventStatus;
            console.log('This is the lengh' + teamsId.length);
            if(teamsId[0] == 0)
            {
     
                teamsId[0] = teamId;
                teamsId = teamsId.join('');
            
              
            } else {
            for(let id of teamsId)
            {
              
                if(id == teamId)
                {
                    console.log("You has already accept this user");
                } 
                else {
                        teamsId += teamId;
                      
                        console.log("This is a type: " + typeof(teamsId));
                    console.log('Success');
                }
            }
            
            }
            user.update({
                eventStatus: teamsId
            })
            
        })
        .then(() => {
            res.redirect('/users-list');
        })
      
    })
    .catch(err => {
        console.log(err);
    })

}

exports.getMentors = (req, res) =>{
        const name = req.session.user.name;
        const roleId = req.session.user.roleId;
        User.findAll({
            where:{
                teamStatus:"Стать ментором"
            }
        })
        .then(users => {
            console.log(users);
            res.render('./users/mentors',
        {
            pageTitle: "Наставники",
            pageTipe: 'adminIn',
            name:name,
            roleId: roleId,
            users: users
        });
        })
        
}

exports.postMentorDeleteRequest = (req,res) => {
    const userId = req.body.userId;
    
    User.findByPk(userId)
    .then(user => {
        user.update({
            teamStatus: "Команды нет"
        })
        return user.save();
    })
    .then(()=>{
        Status.destroy({where:{
            userId:userId
        }})
        .then(() => {
            res.redirect('/mentors');
        })
        
    })
    .catch(err=>{
        console.log(err);
    })
}

exports.postMentorCancleRequest = (req, res) => {
    let userId ;
    let roleId = req.session.user.roleId;
    console.log("This is your " + roleId);
    if(roleId === 1)
    {
        userId = req.body.userId;
        
    } else {
        userId = req.session.user.id;
    }

    console.log("THIS IS YOU USERID: " +  userId);
    User.findByPk(userId)
    .then(user => {
        user.update({
            teamStatus:"Команды нет"
        })
        return user.save();
    })
    .then(() => {
        Status.destroy({
            where: {
                userId: userId
            }
        })
    if(roleId === 1)  
        {
            
            res.redirect('/mentors')
            } else  {
                res.redirect('/profile');
            }
    })
    .catch(err => {
        console.log(err);
    })
}

exports.postMentorAccept = (req,res) => {
    const mentorId = req.body.userId;
    User.findByPk(mentorId)
    .then(mentor => {
        mentor.update({
            s_type: "Заявка принята",
            teamStatus: "Ментор",
            roleId: 3
        })
      
        return mentor.save();
        
    })
    .then(()=>{
        Status.destroy({
            where: {
                userId: mentorId
            }
        })
        .then(()=>{
            res.redirect('/mentors');
        })
    })
    .catch(err => {
        console.log(err);
    })
    
}
// INVENTATION OF USER - THIS IS IN A PROCESS
// exports.getInvitation = (req, res) => {
//     console.log('in a process');
// }

// exports.postAcceptInvitation = (req, res) => {
//     console.log('This is working');
// }

// exports.postCancelInvitation = (req, res) => {
//     console.log("Invintation cancalation")
// }

// exports.postCancelAllInvintation = (req, res) => {
//     console.log('Cancle all invintations is working');
// }


exports.getRequestsPage = (req,res) => {
    const name = req.session.user.name;
    const userId = req.session.user.id;
    let teamId = 0;

    User.findById(userId)
    .then(user => {
        teamId = user.teamId;
    })
    .then(() => {

        Status.findAll({
            include:
            [{model: User, as:'userinfo'}],
            where: { teamId: teamId}
        })
        .then(statuses => {
            res.render('./users/requests-page',{
                statuses:statuses,
                pageTitle: "Заявки в команду",
                pageTipe: 'adminIn',
                name:name
            })
      
        })
        .catch(err => {
            console.log(err);
        })
        
    })
    .catch(err => {
        console.log(err);
    })
}

     
exports.postAcceptRequest = (req, res) => {
   
    const teamMateId = req.body.teamMateId;
    const teamId = req.body.teamId;
    const teamMateEmail = req.body.teamMateEmail;
   
    User.findById(teamMateId)
    .then(user=>{
       user.teamId = teamId;
       user.teamStatus = "Принят"
       return user.save();
    })
 
    Status.destroy({
        where: {userId: teamMateId }
    })
    .then(result => {
        console.log("User have been accepted to a group!!");
        res.redirect('/team-requests');
        return transporter.sendMail({
            to: teamMateEmail,
            from: 'kiguno1996@gmail.com',
            subject: 'Ваша заявка на вступление в команду принята!',
            html: '<h1 Поздравляем вы приняты в команду! </h1>',
            html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;">Вы подавали запрос на вступление в команду для мероприятий "Векторк". Поздравляем, вас приняли!! </p>'
        }); 
    })
   
 }  


 exports.denyRequest = (req, res) => {
    const teamMateId = req.params.teamMateId;
    const teamMateEmail = req.body.teamMateEmail;
    console.log("THIS is a teamMateId");
    User.findById(teamMateId)
    .then(user => {
        user.teamId = 0;
        user.teamStatus = 'Команды нет';
        return user.save();
    })
    Status.destroy({
        where: {userId: teamMateId }
    })

    .then(() => {
        res.redirect('/team-requests');
        return transporter.sendMail({
            to: teamMateEmail,
            from: 'kiguno1996@gmail.com',
            subject: 'Ваша заявка на вступление в команду отклонена!',
            html: '<h1 Поздравляем вы приняты в команду! </h1>',
            html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;">Вы подавали запрос на вступление в команду для мероприятий "Вектор". Заявка была отклонена!  </p>'
        }); 
    })
    .catch(err => {
        console.log(err);
    })
 }  

 exports.postDeleteTeam = (req, res) => {
    const teamId = req.body.teamId;   
    User.findAll({ where: {teamId: teamId}})
    .then(users => {
         for(let i = 0; i < users.length; i++)
            {
                users[i].update({
                    roleId: 5,
                    teamId: 0,
                    teamStatus: 'Команды нет'
                })
            }
        })
        .then(()=>{
            Team.destroy({where: {id:teamId}})
            .then(()=>{
                res.redirect('/profile');
            })
            .catch(err => {
                console.log(err);
                
            })
        })
        .catch(err => {
            console.log(err);
        })
  
 }
 exports.postMentorRequest = (req, res, next ) => {
        
        const userEmail = req.session.user.email; 
        const userId = req.session.user.id;
        User.findById(userId)
        .then(user => {
            user.teamStatus = "Стать ментором";
            return user.save()
            .then(err => {
                console.log("This is an error of requesting: " + err);
            })
            .then(() => {
                 Status.create({
                     userId:user.id,
                     s_type:'В процессе',
                     teamId: 0
                     
                 })
                 .then(()=> {
                 res.redirect('/profile');
                 return transporter.sendMail({
                     to: userEmail,
                     from: 'kiguno1996@gmail.com',
                     subject: 'Вы  сделали запрос на наставника',
                     html: '<h1 Команда вектор ждет тебя!!! </h1>',
                     html: '<p style="text-align: justify; padding: 5%; margin: 0 auto;"> Добрый день. Команда "Вектор" хотела бы вас уведомить о том, что вы подали заявку на вступление в команду. В ближайшее время вашу заявку рассмотрит лидер команды и примет решение. На забудьте проверять свой профиль и почту чтобы видеть свой статус. </p>'
                 }); 
                 
                 })
                 .catch( err => {
                             
                     if(err){
                         console.log(err);
                     } else {
                         console.log('Вы успешно подали заявку в команду')
                     }
                 
                 })
             })
        })
        .catch(err => {
            console.log(err);
        })      
        
 }

 exports.getAdmins = (req,res) => {
    const roleId = req.session.user.roleId;
    console.log('This is a roleId: ' +  roleId);
    const userId = req.session.user.id;
    User.findAll({where:  { 
        $or:
            [
                {
                    roleId:{
                        $eq: 1
                    }, 
                },
                
                 {   roleId:{
                        $eq: 2
                    }
                }
            ] 
        }
        })
    .then(admins => {
        res.render('./users/admins-list',
        {
           userId: userId,
           admins: admins,
           roleId: roleId,
           pageTitle: "Страница администратора",
           pageTipe:"adminIn",
           path: '/',
        })
    })
 }

 exports.postAddAmin = (req,res) => {
    const name = req.body.adminName;
    const surName = req.body.adminSurname;
    const secondName = req.body.adminSecondname;
    const city = req.body.city;
    const position = req.body.position;
    const password = req.body.password;
    const email = req.body.adminEmail;
    const roleId = 2;

    bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      User.create({
            name:name,
            roleId:roleId,
            surname:surName,
            secondname: secondName,
            city:city,
            position: position,
            password: hashedPassword,
            email: email
            
        })
    })
    .then(() => {
        res.redirect('/admins-list');
    })    
    .catch(err => {
        console.log(err);
    })
 }

 exports.postDeleteAdmin = (req, res) => {
     const adminId = req.body.adminId;
     console.log( "This is adminId " + adminId);
     User.destroy({where: {
         id: adminId
     }})
     .then(()=>{
         res.redirect("/admins-list");
     })
     .catch(err => {
        if(err) {
            console.log(err);
        }else{
           console.log("Admin has deleted");
        };
    })
}

exports.adminDeleteMember = (req, res) => {
    const memberId = req.body.memberId;
    User.destroy({ where: {
        id: memberId
    }})
    .then(() => {
        res.redirect('/users-list');
    })
    .catch(err => {
        if(err){
            console.log(err);
        } else {
            console.log("You have deleted the user as an admin!");
        }
    })
}

exports.adminDeclineMember = (req, res ) => {
    const memberId = req.body.memberId;
    const memberSt = req.body.memberStatus;
 
    User.findById(memberId)
    .then(user=>{
        user.update({
            s_type:memberSt
        })
        return user.save();
    })
    .then(() => {
        res.redirect("/users-list");
    })
    .catch(err => {
        if(err){
            console.log(err);
        } else {
            console.log("User has been declined by Admin");
        }
    })
}

exports.adminAcceptMember = (req, res) => {
    consoele.log(express.session.MemoryStore());
} 