const Sequelize = require('sequelize');

const sequelize = new Sequelize('testdatabase', 'root', '1995op1995', 
{
    dialect: 'mysql',
    host:'localhost',
    pool:{
        max:5,
        min:0,
        idle: 200
    },
    operatorsAliases: false
    
});

module.exports = sequelize;