
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const mysql = require('mysql');
var config = require('./config.js');
const bcrypt = require('bcrypt');
const LocalStrategy=require('passport-local').Strategy;
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
var fileUpload = require('express-fileupload')
var MySQLStore = require('express-mysql-session')(session);


var con = mysql.createConnection(config);

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});


app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: new MySQLStore({
        host:'localhost',
        port: 3306,
        user:'root',
        password: 'ps',
        database:'cookie_user'
    }),
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge:1000*60*60*24,
    }
}))
app.use(fileUpload());
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.use('/public', express.static('public'));
app.set("view engine", 'ejs');
const customFields={
    usernameField:'email',
    passwordField:'password',
};

const verifyCallback=(name,password,done)=>{
    console.log(name)
    con.query('SELECT * FROM users WHERE email = ?', [name], async function(error, results, fields){
        if(error){
        return done(error);}
        //results = JSON.parse(JSON.stringify(results));
        if(results.length==0)
        {
            return done(null,false);
        }
        console.log(results);
        //const isValid=validPassword(password,results[0].password);
        user={id:results[0].id,name:results[0].name,email:results[0].email,password:results[0].password,created:results[0].created};
        if(await bcrypt.compare(password, results[0].password)){
            return done(null,user);
        } else {
            return done(null,false);
        }
    });
}

const strategy=new LocalStrategy(customFields,verifyCallback);
passport.use(strategy);

passport.serializeUser((user,done)=>{
    console.log('inside serialize');
    done(null, user.id)
});

passport.deserializeUser(function(userId,done){
    console.log('des'+userId);
    con.query('SELECT * FROM users WHERE id = ?', [userId], function(error, results) {
        done(null,results[0]);
    });
});

async function validPassword(password,hash){
    console.log(password);
    console.log(hash);
    var hashedPassword = await bcrypt.hash(password, 10)
    if(hashedPassword === hash) return true
    else return false;
}

app.get("/posts", (req, res) => {
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    if(page<=0){
        page = 1
    }
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    
    con.query('SELECT * FROM userposts LIMIT ?,?', [startIndex, endIndex],  function(error, results, fields){
        
        results = JSON.parse(JSON.stringify(results));
    
        results.push(next = {
            position: 'next',
            page: page + 1,
            limit: limit
        })
    
        results.push(previous = {
            position: 'before',
            page: page - 1,
            limit: limit
        })
        
        //console.log(results);
        res.json(results);
})})

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.get('/upload', (req, res) => {
    if(req.isAuthenticated()){
    res.render('upload.ejs')}
    else
    res.redirect('/login');
})

app.post('/upload', (req,res) =>
{

    let uploadFile;
    let uploadPath;

    if(!req.files || Object.keys(req.files).length === 0){
        return res.status(400).send('No files were uploaded.')
    }
    uploadFile = req.files.uploadFile;
    let newfilename = req.user.id+'_';
    uploadPath=__dirname+'/public/uploads/'+ newfilename + uploadFile.name; 
    //todo ogarnac nazwy
    uploadFile.mv(uploadPath, function(err){
        if(err) return res.status(500).send(err);

    

    });
    let tag = req.body.taglist
    //console.log(tag)

    try{
        console.log(req.body.postname+'1')
        let sql = `INSERT INTO userposts(userid,title,score,tag,created,fileurl) VALUES(?,?,?,?,?,?)`
        let todo = [req.user.id, req.body.postname, 1, tag, new Date().toISOString().slice(0, 19).replace('T', ' '), '/public/uploads/'+ newfilename + uploadFile.name]
        con.query(sql, todo, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
        })
        res.redirect('/upload')
    } catch {
        res.redirect('/upload')
    }
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/logout',(req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
      });
});

app.get('/register', (req, res) => {
    res.render('register.ejs')
})
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        let sql = `INSERT INTO users(name,email,password,created) VALUES(?,?,?,?)`
        let todo =[req.body.name,req.body.email,hashedPassword, new Date().toISOString().slice(0, 19).replace('T', ' ')]
        con.query(sql, todo, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

app.listen(3002)