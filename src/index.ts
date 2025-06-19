declare global {
  namespace Express {
    export interface Request {
      userId?: string;
    }
  }
}




import express from "express";
import jwt from "jsonwebtoken";
import {ContentModel,UserModel,LinkModel} from "./db";
import { JWT_PASSWORD } from "./config";
import { userMiddleware } from "./middleware";
import cors from "cors";
import {random} from "./utils"; 









const app = express();
app.use(express.json());
app.use(cors());



app.post("/api/v1/signup", async (req, res) =>{
    // TODO: zod validation, hash the password
    const username= req.body.username;
    const password=req.body.password;

    try {
   await  UserModel.create({
        username: username,
        password:password

    });
    res.json({
        message:"User signed up"
    });

}

catch(e){
    res.status(411).json({
        message:"User already exists"
    });
}
});


app.post("/api/v1/signin", async(req, res)=>{
    const username =req.body.username;
    const password=req.body.password;
    try{
    const existingUser= await UserModel.findOne({
        username,
        password
    });
        if(existingUser){
            const token=jwt.sign({
                id:existingUser._id
            },JWT_PASSWORD)

            res.json({
              message:"User signin successfully",
                token:token
            });
            }
            else{
                res.status(403).json({
                    message:"Invalid username or password"
                });

            }
        
      }
      catch(e){
        res.status(404).json({
          message:"User not foundf",
        });
      }
    });
    



app.post("/api/v1/content",userMiddleware, async (req, res) => {
  const link= req.body.link;
  const type = req.body.type;

  await ContentModel.create({
    link,
    type,
    title: req.body.title,
    userId: req.userId,
    tags: []
  })

   res.json({
    message: "Content created successfully"
  });

});





app.get("/api/v1/content", userMiddleware, async (req,res)=>{

  const userId = req.userId;
  
  const content = await ContentModel.find({
    userId: userId,


  }).populate("userId", "username") 
  res.json({
    content
  });

});




app.delete("/api/v1/content",userMiddleware , async (req,res)=>{
  const contentId =req.body.contentId;

  await ContentModel.deleteOne({
  _id: contentId,
  userId: req.userId
});

res.json({
  message: "  Content deleted successfully"
})
});



app.post("/api/v1/share",userMiddleware, async(req,res)=>{
  const share= req.body.share;

  if(share){
    const existingLink = await LinkModel.findOne({
      userId: req.userId
    });
    
    if(existingLink){
      res.json({
        hash: existingLink.hash
      })
      return;
    }
    const hash = random(10);
    await LinkModel.create({
      userId: req.userId,
      hash:hash
    });
    res.json({
      hash:hash
    });
  
    
  }
  else{
    await LinkModel.deleteOne({
      userId:req.userId
    });
    res.json({
      message:"Link deleted successfully"
    })
  }

});




app.get("/api/v1/:shareLink",userMiddleware, async (req,res)=>{
  const hash=req.params.shareLink;

  const link=await LinkModel.findOne({
    hash
  });
  if(!link){
    res.status(411).json({
      message:"Sorry incorrect input"
    })
    return;
  }
      const content = await ContentModel.find({
        userId: link.userId
    })

    console.log(link);
    const user = await UserModel.findOne({
      _id: link.userId
    })

    if(!user){
      res.status(411).json({
        message:"user not found, error should idealy not happen"
      })
      return;
    }
    res.json({
      username:user.username,
      content: content
    })
  
});


app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});




