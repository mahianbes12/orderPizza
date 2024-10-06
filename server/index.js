// Import necessary packages and modules
const express = require('express');
const bodyParser = require('body-parser');

const cors = require('cors');
const app = express();

var corOptions = {
  origin: 'https://localhost:3001'
}

//middleware
app.use(cors())
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({extended : true}))

//
const db = require('./models/index.js')
db.sequelize.sync();

db.sequelize.sync({force: false })
.then(() => {

  console.log('it is working');
}); 

//testing api
app.get('/',(req,res)=>{
  res.json({message: 'Welcome to epayment'})
})

//Port

const PORT = process.env.PORT || 3000


// start server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});