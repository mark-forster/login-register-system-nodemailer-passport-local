const express= require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const indexRoute= require('./routers/index');
const authRoute = require('./routers/auth');
const bodyParser = require('body-parser');
const session= require('express-session')
const flash = require('connect-flash');
const passport= require('passport');
require('./config/passport')(passport);

// connecting Mong DB

mongoose.connect('mongodb+srv://hello:arakan@verifyemail.fmlgtiy.mongodb.net/?retryWrites=true&w=majority',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
    console.log('connected to database')
});


// template engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// configuraction session
app.use(session({
    secret:process.env.SESSION_SECRET_KEY,
    resave:false,
    saveUninitialized:false,
})); 

//------------ Passport Middlewares ------------//
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRoute);
app.use('/auth/', authRoute);

app.listen(process.env.PORT, ()=>{
    console.log('server is running on port 3000')
})