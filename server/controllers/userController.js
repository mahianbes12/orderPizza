const asyncHandler = require('express-async-handler');
const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');


// Import required models
const { User, Payment, Bill, Agents, ServiceProviders, UserServiceProvider } = require('../models');

const { Op } = require('sequelize');
// Create and save a new user
exports.create = async (req, res) => {
  // Validate request
  const requiredFields = [
    'UserID',
    'FirstName',
    'LastName',
    'Gender',
    'UserName',
    'Email',
    'Password',
    'PhoneNumber',
    'Address',
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    res.status(400).send({
      message: `${missingFields.join(', ')} cannot be empty`,
    });
    return;
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      Email: req.body.Email,
    },
  });

  if (existingUser) {
    res.status(409).send({
      message: 'User already exists',
    });
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(req.body.Password, 10);

  // Create a user object
  const user = {
    UserID: req.body.UserID,
    FirstName: req.body.FirstName,
    LastName: req.body.LastName,
    Gender: req.body.Gender,
    UserName: req.body.UserName,
    Password: hashedPassword,
    Email: req.body.Email,
    PhoneNumber: req.body.PhoneNumber,
    Address: req.body.Address,
    Role: req.body.Role,
    ProfilePicture: req.file ? req.file.path : null,
    serviceProviderBIN: req.body.serviceProviderBIN,
  };

  try {
    // Save user in the database
    const createdUser = await User.create(user);

    // Add associations with payment, bill, and agents
    if (req.body.paymentId) {
      const paymentInstance = await Payment.findByPk(req.body.paymentId);
      if (paymentInstance) {
        await createdUser.addPayments(paymentInstance);
      }
    }

    if (req.body.billIds && req.body.billIds.length > 0) {
      const bills = await Bill.findAll({
        where: {
          id: {
            [Op.in]: req.body.billIds,
          },
        },
      });
      if (bills) {
        await createdUser.addBill(bills);
      }
    }

    if (req.body.agentBINs && req.body.agentBINs.length > 0) {
      const agentBINs = req.body.agentBINs;
      const agents = await Agents.findAll({
        where: {
          agentBIN: {
            [Op.in]: agentBINs,
          },
        },
      });
      if (agents.length !== agentBINs.length) {
        const existingAgents = agents.map((agent) => agent.agentBIN);
        const missingAgents = agentBINs.filter((agentBIN) => !existingAgents.includes(agentBIN));
        res.status(404).send({
          message: `Agents with IDs ${missingAgents.join(', ')} not found`,
        });
        return;
      }
      await createdUser.addAgents(agents);
    }

    if (req.body.serviceProviderBINs && req.body.serviceProviderBINs.length > 0) {
      const serviceProviderBINs = req.body.serviceProviderBINs;
      const serviceProviders = await ServiceProviders.findAll({
        where: {
          serviceProviderBIN: {
            [Op.in]: serviceProviderBINs,
          },
        },
      });
      if (serviceProviders.length !== serviceProviderBINs.length) {
        const existingServiceProviders = serviceProviders.map((sp) => sp.serviceProviderBIN);
        const missingServiceProviders = serviceProviderBINs.filter(
          (sp) => !existingServiceProviders.includes(sp)
        );
        res.status(404).send({
          message: `Service providers with IDs ${missingServiceProviders.join(', ')} not found`,
        });
        return;
      }
    
      // Generate random unique serviceNo
      const generatedServiceNos = new Set();
      while (generatedServiceNos.size < serviceProviders.length) {
        const randomServiceNo = Math.floor(100000 + Math.random() * 900000);
        generatedServiceNos.add(randomServiceNo);
      }
    
      // Create associations and add serviceNo to the junction table
      for (let i = 0; i < serviceProviders.length; i++) {
        const serviceProvider = serviceProviders[i];
        const serviceNo = Array.from(generatedServiceNos)[i]; // Convert Set to Array and access by index
        await createdUser.addServiceProviders(serviceProvider, {
          through: {
            serviceNo: serviceNo,
          },
        });
      }
    }
    
    const data = await User.findOne({
      where: {
        id: createdUser.id,
      }, 
      include: [
        {
          model: ServiceProviders,
          as: 'ServiceProviders',
          attributes: ['serviceProviderBIN', 'serviceProviderName'],
          through: { attributes: ['serviceNo'] }, // Include the serviceNo in the through table
        },
        {
          model: Payment,
          as: 'Payments',
        },
        {
          model: Bill,
          as: 'Bills',
        },
        {
          model: Agents,
          as: 'Agents',
        },
      
      ],
    });

    res.send(data);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map((err) => err.message);
      res.status(400).send({
        message: 'Validation error',
        errors: errors,
      });
    } else {
      console.error('Error saving user:', error);
      res.status(500).send({
        message: 'Error saving user',
      });
    }
  }
};

// Retrieve all users
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Payment,
          as: 'Payments',
        },
        {
          model: Bill,
          as: 'Bills',
        },
        {
          model: Agents,
          as: 'Agents',
        },
        {
          model: ServiceProviders,
          as: 'ServiceProviders',
        },
      ],
    });
    res.send(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).send({
      message: 'Error retrieving users',
    });
  }
};

exports.findOneByServiceNo = asyncHandler(async (req, res) => {
  const serviceNo = req.params.serviceNo;

  try {
    const user = await db.User.findOne({
     include: [
         {
          model: db.ServiceProviders,
          as: 'ServiceProviders',
          through: {
            model: db.UserServiceProvider,
            as: 'userServiceProvider',
            where: { serviceNo: serviceNo },
            required: true,
          },
        },
        {
          model: Payment,
          as: 'Payments',
        },
        {
          model: Bill,
          as: 'Bills',
        },
        {
          model: Agents,
          as: 'Agents',
        },
      ],
      distinct: true 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.send(user);
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Find a single user by id
exports.findOne = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;

    const users = await User.findByPk(id, {
      include: [
        {
          model: Payment,
          as: 'Payments',
        },
        {
          model: Bill,
          as: 'Bills',
        },
        {
          model: Agents,
          as: 'Agents',
        },
        {
          model: ServiceProviders,
          as: 'ServiceProviders',
        },
      ],
    });
    res.send(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).send({
      message: 'Error retrieving users',
    });
  }
});



// Update a user by id
exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;

  try {
    // Find the user by ID
    const user = await User.findByPk(id,
      );

    if (!user) {
      res.status(404).send({
        message: `User with id=${id} not found`,
      });
    } else {
      // Update the user fields based on the request body
      user.FirstName = req.body.FirstName || user.FirstName;
      user.LastName = req.body.LastName || user.LastName;
      user.Gender = req.body.Gender || user.Gender;
      user.UserName = req.body.UserName || user.UserName;
      user.Email = req.body.Email || user.Email;
      user.PhoneNumber = req.body.PhoneNumber || user.PhoneNumber;
      user.Address = req.body.Address || user.Address;
      user.Role = req.body.Role || user.Role;

      // Update the profile picture if provided in the request
      if (req.file) {
        user.ProfilePicture = req.file.path;
      }

      // Update the password if provided in the request
      if (req.body.Password) {
        const hashedPassword = await bcrypt.hash(req.body.Password, 10);
        user.Password = hashedPassword;
      }
      try {

        // Add associations with payment, bill, and Agents
        if (req.body.paymentId) {
          const paymentInstance = await Payment.findByPk(req.body.paymentId);
          if (paymentInstance) {
            await user.setPayment(paymentInstance);
          }
        }

        if (req.body.billIds && req.body.billIds.length > 0) {
          const bills = await Bill.findAll({
            where: {
              id: {
                [Op.in]: req.body.billIds,
              },
            },
          });
          if (bills) {
            await user.addBill(bills);
          }
        }

        if (req.body.agentBINs && req.body.agentBINs.length > 0) {
          const agents = await Agents.findAll({
            where: {
              id: {
                [Op.in]: req.body.agentBINs,
              },
            },
          });
          if (agents) {
            await user.addAgents(agents);
          }
        }
        if (req.body.serviceProviderBINs && req.body.serviceProviderBINs.length > 0) {
          const serviceProvider = await ServiceProviders.findAll({
            where: {
              id: {
                [Op.in]: req.body.serviceProviderBINs,
              },
            },
          });
          if (serviceProvider) {
            await createdUser.setServiceProviders(serviceProvider);
            await createdUser.addServiceProviders(serviceProvider, {
              through: UserServiceProvider,
              UserId: createdUser.id,
              serviceProviderBIN: req.body.serviceProviderBIN,
            });
          }
          else {
            console.log('Error ');
          }
        }


        // Remove associations with payment, bill, and agents
        if (req.body.removePayment) {
          await user.setPayments(null);
        }

        if (req.body.removeBillIds && req.body.removeBillIds.length > 0) {
          const bills = await Bill.findAll({
            where: {
              id: {
                [Op.in]: req.body.removeBillIds,
              },
            },
          });
          if (bills) {
            await user.removeBill(bills);
          }
        }

        if (req.body.removeAgentBINs && req.body.removeAgentBINs.length > 0) {
          const agents = await Agents.findAll({
            where: {
              id: {
                [Op.in]: req.body.removeAgentBINs,
              },
            },
          });
          if (agents) {
            await user.removeAgents(agents);
          }
        } if (req.body.serviceProviderBINs && req.body.serviceProviderBINs.length > 0) {
          const serviceProviders = await ServiceProviders.findAll({
            where: {
              id: {
                [Op.in]: req.body.serviceProviderBINs,
              },
            },
          });
          if (serviceProviders) {
            await createdUser.addServiceProviders(serviceProviders);
            // Add entries to the junction table
            await createdUser.addServiceProviders(serviceProviders, {
              through: {
                UserId: createdUser.id,
                serviceProviderBIN: serviceProviders.map(sp => sp.id),
              },
            });
          }
        }
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({
          message: 'Error updating user',
        });
      }

      // Save the updated user
      await user.save();

      res.send({
        message: 'User was updated successfully.',
        user: user,
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({
      message: 'Error updating user',
    });
  }
});

// Delete a user by id
exports.delete = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const num = await User.destroy({
    where: { id: id },
  });

  if (num === 1) {
    res.send({
      message: 'User was deleted successfully!',
    });
  } else {
    res.send({
      message: `Cannot delete user with id=${id}. User not found!`,
    });
  }
});

exports.login = async (req, res) => {
  // Validate request
  const { identifier, Password } = req.body;

  if (!identifier || !Password) {
    res.status(400).send({
      message: 'Username/Email and password are required',
    });
    return;
  }

  try {
    // Find the user by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ Email: identifier }, { UserName: identifier }],
      },
      include: [
        // Include the required associations
        {
          model: ServiceProviders,
          as: 'ServiceProviders',
          through: { attributes: ['serviceNo'] }
        },
        {
          model: Payment,
          as: 'Payments',
        },
        {
          model: Bill,
          as: 'Bills',
        },
        {
          model: Agents,
          as: 'Agents',
        },
      ],
    });

    if (!user) {
      res.status(404).send({
        message: 'User not found',
      });
      return;
    }

    // Compare the provided password with the hashed password stored in the database
    const isPasswordValid = await bcrypt.compare(Password, user.Password);

    if (!isPasswordValid) {
      res.status(401).send({
        message: 'Invalid password',
      });
      return;
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expiration time
    });

    res.send({
      message: 'Login successful',
      token: token,
      user: user,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send({
      message: 'Error during login',
    });
  }
};

// upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))

  }
})
exports.upload = multer({
  storage: storage,
  limits: { fileSize: '1000000' },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname));
    if (mimeType && extname) {
      return cb(null, true);
    }
    cb('provide the proper format');
  }
}).single('ProfilePicture');



// Request password reset
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  // Validate request
  if (!req.body.Email) {
    res.status(400).send({
      message: 'Email is required',
    });
    return;
  }

  // Check if user exists
  const user = await User.findOne({
    where: {
      Email: req.body.Email,
    },
  });

  if (!user) {
    res.status(404).send({
      message: 'User not found',
    });
    return;
  }

  // Generate a unique reset token
  const resetToken = uuidv4();

  // Save the reset token and its expiration date in the user's record
  user.resetToken = resetToken;
  user.resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour
  await user.save();

  // Send password reset email to the user
  const senderEmail = "edenzewdu434@gmail.com";
  const senderPassword = "gyefcyzofjjpvheh";
  const recipientEmail = req.body.Email;
  const subject = 'Password Reset Request';
  const resetLink = `http://localhost:3001/Users/UpdatePassword#/${resetToken}`;
  const message =` Dear ${user.FirstName},\n\nWe received a request to reset your password.\n\nTo reset your password, click on the following link:\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nYourApp Team`;

  sendEmail(senderEmail, senderPassword, recipientEmail, subject, message);

  res.send({
    message: 'Password reset email sent',
  });
});

// Function to send an email
async function sendEmail(senderEmail, senderPassword, recipientEmail, subject, message) {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "edenzewdu434@gmail.com",
        pass: "gyefcyzofjjpvheh",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
                    
    // Define the email options
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      text: message,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


// Verify reset password token
exports.verifyResetToken = asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;

    // Check if token is valid and not expired
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: { [db.Sequelize.Op.gt]: Date.now() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired token' });
    } else {
      res.status(200).json({ message: 'Token is valid' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify token', message: error.message });
  }
});

exports.updatePasswordWithToken = asyncHandler(async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if email is valid
    const user = await User.findOne({
      where: {
        Email: Email,
      },
    });

    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }
    console.log('Email:', Email);
console.log('Password:', Password);
console.log('', user);

    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // Update user's password
    user.Password = hashedPassword;
    user.resetToken = null;    
    user.resetTokenExpiration = null;
    user.updatedAt = new Date(); // Set updatedAt field
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password', message: error.message });
  }
});