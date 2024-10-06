const express = require('express');
const userRouter = express.Router();
const UserController = require('../controller/UserController.js');


userRouter.post('/',UserController.upload,UserController.create)
userRouter.post('/login', UserController.login)
userRouter.post('/verifyResetToken', UserController.verifyResetToken)
userRouter.post('/updatePasswordWithToken', UserController.updatePasswordWithToken )
userRouter.get('/', UserController.findAll)
userRouter.get('/:id', UserController.findOne);
userRouter.get('/serviceNo/:serviceNo', UserController.findOneByServiceNo);
userRouter.put('/:id', UserController.upload, UserController.update)
userRouter.delete('/:id', UserController.delete)
userRouter.post('/requestPasswordReset', UserController.requestPasswordReset);
module.exports= userRouter;