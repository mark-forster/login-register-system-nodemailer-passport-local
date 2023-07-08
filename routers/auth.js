const express= require('express');
const router= express.Router();
const userController= require('../controllers/user');

// register route
router.get('/register', userController.register);
router.post('/register', userController.registerHandle);
// active handles
router.get('/activate/:token', userController.activateHandle)
// login route
router.get('/login', userController.login);
router.post('/login', userController.loginHandle);
// forgot password routes
router.get('/forgotpassword', userController.forgotpassword);
router.post('/forgotpassword', userController.forgotpasswordHandle);
router.get('/forgot/:token', userController.gotoResetPassword);
router.get('/resetpassword/:id', userController.resetHandle)
router.post('/resetpassword/:id', userController.resetPasswordHandle)
// 

// logout route
router.post('/logout', userController.logout);

module.exports = router;