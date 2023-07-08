const User= require('../model/user');
const passport = require('passport');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt= require('jsonwebtoken');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;



const register = async (req,res,next) => {
    let message=req.flash('error');
    let success_msg=req.flash('success_msg');
    if(message.length > 0){
        message=message[0]
    }
    else{
        message = null;
    }
    res.render('register', {message: message, success_msg: success_msg});
}

const registerHandle = async (req,res,next) => {
    // checking input Data
    const {username, email, password, password1}= req.body;
    if(!username || !email || !password || !password1){
        req.flash('error','All input fields are required');
        return res.redirect('/auth/register');
    }
    // check Password Match
    if(password!== password1){
        req.flash('error','Passwords do not match');
        return res.redirect('/auth/register');
    }
    //check password length
    if(password.length < 6){
        req.flash('error','Password must be at least 6 characters');
                return res.redirect('/auth/register');
    }
    // checking if email already exists
    const emailUser = await User.findOne({email: email});
    if(emailUser){
        req.flash('error','Email already exists');
        return res.redirect('/auth/register');
    }
    else{
            const Oauth2Client = new OAuth2(process.env.CLIENT_ID,
                 process.env.CLIENT_SECRET_KEY,
                  process.env.REDIRECT_URL);

            Oauth2Client.setCredentials({ 
                refresh_token: process.env.REFRESH_TOKEN 
            });

            async function sendMail(){
                try{
                    const accessToken = await Oauth2Client.getAccessToken();
                    const transoprter= nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            type: 'OAuth2',
                                  user: process.env.EMAIL,
                                  clientId: process.env.CLIENT_ID,
                                  clientSecret: process.env.CLIENT_SECRET_KEY,
                                refreshToken: process.env.REFRESH_TOKEN,
                                accessToken:accessToken
                        }
                    });


                    const token = jwt.sign({ username, email, password }, process.env.JWT_KEY, { expiresIn: '30m' });
                        const CLIENT_URL = 'http://' + req.headers.host;

                        const output = `
                        <h2>Please click on below link to activate your account</h2>
                        <p>${CLIENT_URL}/auth/activate/${token}</p>
                        <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
                        `;


                    const mailOptions = {
                        from: 'Q-account_varify <jakeriley082@gmail.com>',
                        to: email,
                        subject: 'Registration Successful',
                        html:output
                    };
                    
                    const result= await transoprter.sendMail(mailOptions);
                    return result;

                }
                catch(err){
                            console.log(err);
                           }
            } 

            sendMail().then(result=>{
                console.log( 'Email Sent.........',result);
            }).catch(err=>
                console.log(err));



        req.flash('success_msg','Registration successful, Check your email');
        res.redirect('/auth/login');
    }
   
   
}

const login = (req, res, next) => {
   
    let success_msg=req.flash('success_msg');
    let error_msg=req.flash('error');
    if(success_msg.length > 0 || error_msg.length > 0){
        success_msg=success_msg[0];
        error_msg=error_msg[0];
    }
    else{
        success_msg = null;
        error_msg = null;
    }
    res.render('login', {success_msg: success_msg, message: error_msg});
}


const activateHandle=async (req, res,next) => {
        try{
            const token= req.params.token;
                    if(token){
                 const jwtToken=jwt.verify(token, process.env.JWT_KEY, (err, decodedToken) => {
                    if(err){
                          req.flash('error','Invalid Token');
                         return res.redirect('/auth/login');
                    }
                    return decodedToken;
                    });

                    const user= await User.findOne({email:jwtToken.email});
                    if(user){
                        req.flash('error','Email Already exit please register another Email');
                        return res.redirect('/auth/login');
                    } //end if user
                   
                        const newUser= await new User({
                            name:jwtToken.username,
                             email: jwtToken.email,
                             password: bcryptjs.hashSync(jwtToken.password,10)
                        });
                        await newUser.save();
                        req.flash('success_msg','Account Activated! Login Here');
                        return res.redirect('/auth/login');
                    
                }//end if token
                else{
                    req.flash('error','Invalid Token');
                    return res.redirect('/auth/login');
                }
                    
        }

        catch(err){
                    
            console.log(err);
            }
};


// POST /auth/login
// login function
const loginHandle= async (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, next);
};

// GET /auth/logout
const logout= async (req, res, next) => {
    req.logout( (err)=>{
        if(err){
          return  next(err);
        }
        req.flash('success','Successfully logged out');
        res.redirect('/auth/login');
    })
  
}


// forgotpassword 
const forgotpassword= async (req, res, next) => {
    let success_msg=req.flash('success_msg');
    let error_msg=req.flash('error');
    if(success_msg.length > 0 || error_msg.length > 0){
        success_msg=success_msg[0];
        error_msg=error_msg[0];
    }
    else{
        success_msg = null;
        error_msg = null;
    }

       
    res.render('forgotpassword', {success_msg: success_msg, message: error_msg});
};

// forgotpasswordHandle
const forgotpasswordHandle= async (req, res, next) => {
    const email= req.body.email;
    if(!email){
        req.flash('error','Email is required');
                return res.redirect('/auth/forgotpassword');
    }
    await User.findOne({email:email}).then(user=>{
        if(!user){
            req.flash('error','Invalid Email');
            return res.redirect('/auth/forgotpassword');
        }
        else{
            const Oauth2Client = new OAuth2(process.env.CLIENT_ID,
                process.env.CLIENT_SECRET_KEY,
                 process.env.REDIRECT_URL);

           Oauth2Client.setCredentials({ 
               refresh_token: process.env.REFRESH_TOKEN 
           });

           
           const token = jwt.sign({ _id:user._id }, process.env.JWT_KEY, { expiresIn: '30m' });
           const CLIENT_URL = 'http://' + req.headers.host;

           const output = `
           <h2>Please click on below link to activate your account</h2>
           <p>${CLIENT_URL}/auth/activate/${token}</p>
           <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
           `;
            User.updateOne({_id:user._id},{$set:{resetLink:token}})
            .then((err,result)=>{
                async function sendMail(){
                    try{
                        const accessToken = await Oauth2Client.getAccessToken();
                        const transoprter= nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                type: 'OAuth2',
                                      user: process.env.EMAIL,
                                      clientId: process.env.CLIENT_ID,
                                      clientSecret: process.env.CLIENT_SECRET_KEY,
                                    refreshToken: process.env.REFRESH_TOKEN,
                                    accessToken:accessToken
                            }
                        });
    
    
                     
                            const CLIENT_URL = 'http://' + req.headers.host;
    
                            const output = `
                            <h2>Please click on below link to reset your account</h2>
                            <p>${CLIENT_URL}/auth/forgot/${token}</p>
                            <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
                            `;
    
    
                        const mailOptions = {
                            from: 'Q-account_varify <jakeriley082@gmail.com>',
                            to: email,
                            subject: 'Registration Successful',
                            html:output
                        };
                        
                        const result= await transoprter.sendMail(mailOptions);
                        return result;
    
                    }
                    catch(err){
                                console.log(err);
                               }
                } 
    
                sendMail().then(result=>{

                    req.flash('success_msg','Check your email Inbox to reset your password, we sent reset link to your email');
                         res.redirect('/auth/forgotpassword')
                
                
                        }).catch(err=>
                    console.log(err));
                    res.redirect('/auth/login');

                
             
            });

            

           
        }
    });
};


// Reset password
const gotoResetPassword= async (req, res, next) => {
    const token = req.params.token;
        const jwtToken=jwt.verify(token, process.env.JWT_KEY, (err,decodedToken) => {
            const {_id}=decodedToken;
             User.findById({_id:_id})
            .then(user=>{
                console.log(`${_id}`);
                console.log(user);
                res.redirect(`/auth/resetpassword/${_id}`);
            });
          
});
}


// reset Handle
const resetHandle= async (req, res, next) => {
    let success_msg=req.flash('success_msg');
    let error_msg=req.flash('error');
    if(success_msg.length > 0 || error_msg.length > 0){
        success_msg=success_msg[0];
        error_msg=error_msg[0];
    }
    else{
        success_msg = null;
        error_msg = null;
    }
    res.render('resetpassword',{success_msg: success_msg, message: error_msg});
}

const resetPasswordHandle= async (req, res, next) => {
    const {password1,password2}=req.body;
    const id= req.params.id;
    if(!password1 ||!password2){
            req.flash('error','All fields are required');
            return res.redirect(`/auth/resetpassword/${id}`);
    }
    if(password1!==password2){
            req.flash('error','Passwords do not match');
            return res.redirect(`/auth/resetpassword/${id}`);
    }

    await User.findByIdAndUpdate({_id:id},{$set:{password:bcryptjs.hashSync(password1,10)}});
   

    res.redirect(`/auth/login`);
}

module.exports = {
    register,
    registerHandle,
    login,
    activateHandle,
    loginHandle,
    forgotpassword,
    forgotpasswordHandle,
    gotoResetPassword,
    resetHandle,
    resetPasswordHandle,
    logout
};