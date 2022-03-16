// importing required libraries

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const res = require("express/lib/response");

const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/HRanker", {useNewUrlParser: true,useUnifiedTopology: true});

// making schema and collection for user to register ,collection 'User' has stored credentials of registered users
const userSchema = {
   email:String,
   username:String,
   password:String
};

const User = mongoose.model("User", userSchema);

// making schema for work added
const workschema={
    work:String
};
const Work=mongoose.model("Work",workschema);

// making schema to store  information about each user
const userWorkListschema={
    email:String,
    username:String,
    ownwork:[workschema],
    req_work:[workschema]
};
const userWorkList=mongoose.model("userWorkList",userWorkListschema);

// just used to populated at some array,no need to give much attention
const work1=new Work({work:"jkdfjd"});
const defalult=[work1];

// making route for landing page
app.get("/",function(req,res){
    res.render("login",{flag:0});
})

// making route to migrate to signup page
app.get("/signup",function(req,res){
    res.render("signup",{flag:0});
})

// route to handle login and signup thing, and redirect authentic user to their specific dashboard
app.post("/:type",function(req,res){
    const type=req.params.type;
    if(type==="login")
    {
        console.log("login successfull");
        const email=req.body.email;
        const password=req.body.password;
        User.findOne({email:email,password:password},function(err,foundlist){
            if(!err)
            {
                if(!foundlist)
                {
                    res.render("login",{flag:1})
                }
                else
                {
                    
                    res.redirect("/list/"+email);
                }
            }
        })

    }
    else
    {
        const name=req.body.username;
        const email=req.body.email;
        const password=req.body.password;
        User.findOne({email:email},function(err,foundlist)
        {
            if(!err)
            {
                if(!foundlist)
                {

                    const user = new User(
                        {
                            email:email,
                            username:name,
                            password:password
                        }
                    );
                    user.save();
                    const userWorkList1=new userWorkList({
                        email:email,
                        username:name,
                        ownwork:defalult,
                        req_work:defalult
                    });
                    userWorkList1.save();

                    res.redirect("/list/"+email);
                }
                else
                {
                    res.render("signup",{flag:1});
                    
                }
            }
        })

        // console.log(name,email,password)
        // console.log("signup good");

    }
})

// used to render customised work_list page for user
app.get("/list/:email",function(req,res)
{
    const email=req.params.email;
    userWorkList.findOne({email:email},function(err,foundthing){
        if(!err)
        {
            // console.log(foundthing);
            // console.log(foundthing.ownwork);
            // console.log(email);
            res.render("work_list",{own_work:foundthing.ownwork,req_work:foundthing.req_work,email:email});
        }
    })

})


// used to handle own added tasks,handles things like allowing and sharing 
app.post("/own/delshare",function(req,res){
    const email=req.body.email;
    const workid=req.body.workid;
    const action=req.body.action;
    const workname=req.body.workname;
    const receivermail=req.body.receivermail;
    if(action==="Done")
    {
        userWorkList.findOneAndUpdate({email: email}, {$pull: {ownwork: {_id: workid}}}, function(err, foundList){
            if (!err){
              res.redirect("/list/" + email);
            }
          });
    }
    else
    {
        const work=new Work({
            work:workname
        });
        userWorkList.findOne({email:receivermail},function(err,foundthing){
            foundthing.req_work.push(work);
            foundthing.save();
            res.redirect("/list/"+email);
        })
    }
    console.log(email,workid,action);
})

// used to add new work, and accept or reject the requests
app.post("/work/addAcceptDel",function(req,res){
    const action=req.body.action;
    const email=req.body.email;
    if(action==="Add")
    {
        const workname=req.body.workname;
        const addwork=new Work({
            work:workname
        })
        userWorkList.findOne({email:email},function(err,foundthing){
            if(!err)
            {
                foundthing.ownwork.push(addwork);
                foundthing.save();
            }
        })
    }
    else if(action==="Accept")
    {
        const req_workname=req.body.req_workname;
        const req_workid=req.body.req_workid;
        // removing this work from request list
        userWorkList.findOneAndUpdate({email: email}, {$pull: {req_work: {_id: req_workid}}}, function(err, foundList){
            if (!err){
            //   res.redirect("/" + email);
            }
          });
        // after removing from requestlist , adding it to the user ownwork list
        const addwork=new Work({
            work:req_workname
        })
        userWorkList.findOne({email:email},function(err,foundthing){
            if(!err)
            {
                foundthing.ownwork.push(addwork);
                foundthing.save();
            }
        })

    }
    else
    {
        const req_workid=req.body.req_workid;
        // removing this work from request list
        userWorkList.findOneAndUpdate({email: email}, {$pull: {req_work: {_id: req_workid}}}, function(err, foundList){
            if (!err){
            //   res.redirect("/" + email);
            }
          });
    }
    res.redirect("/list/"+email);
})

app.listen(3000,function(){
    console.log("app is running at 3000")
});
