const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();

//middleware
app.use(helmet());

//static files
app.use('/' , express.static(path.join(__dirname , "public")));


//listen to port
const PORT = 5000 || process.env.PORT;
app.listen(PORT , () => console.log(`server is running on port ${PORT}`))