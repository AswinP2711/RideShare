//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const app = express();

app.use(flash());

const oneDay = 1000 * 60 * 60 * 24;

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/RideShare", {
  useNewUrlParser: true,
});

const signupSchema = {
  name: String,
  dob: String,
  gender: String,
  email: String,
  phone: Number,
  documenttype: String,
  documentnumber: String,
  password: String,
};

const signupDetails = mongoose.model("signupDetails", signupSchema);

const loginSchema = {
  username: String,
  password: String,
};

const loginDetails = mongoose.model("LoginDetails", loginSchema);

const publishSchema = {
  name: String,
  mailid: String,
  phone: String,
  source: String,
  destination: String,
  date: String,
  time: String,
  availability: Number,
  fare: Number,
};

const publishDetails = mongoose.model("publishDetails", publishSchema);

const requestSchema = {
  name: String,
  RequesterMailid: String,
  PublisherMailid: String,
  source: String,
  destination: String,
  date: String,
  time: String,
  fare: Number,
  availability: Number,
  Selectedseats: Number,
  Status: String,
};

const Request = mongoose.model("Request", requestSchema);

const complaintSchema = {
  CompalinteeMailID: String,
  RiderMailId: String,
  Description: String,
};

const complaintRider = mongoose.model("complaintRider", complaintSchema);

const ReomovedSchema = {
  name: String,
  mailid: String,
  phone: String,
};

const Removed = mongoose.model("Removed", ReomovedSchema);

const SuspendedSchema = {
  name: String,
  mailid: String,
  phone: String,
  Password: String,
};

const Suspended = mongoose.model("Suspended", SuspendedSchema);

function auth(req, res, next) {
  if (req.session.userEmail) {
    next();
  } else {
    res.redirect("/login");
  }
}

function guard(req, res, next) {
  if (req.session.userEmail) {
    res.redirect("/rider");
  } else {
    next();
  }
}

app.get("/", guard, function (req, res) {
  res.render("index");
});

app.get("/login", guard, function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  var userName = req.body.userID;
  var password = req.body.pass;

  Removed.findOne({ mailid: userName }, function (err, foundUser) {
    if (foundUser) {
      res.render("UserRemoved");
    } else {
      Suspended.findOne({ mailid: userName }, function (err, foundUser) {
        if (foundUser) {
          res.render("UserSuspended");
        } else {
          loginDetails.findOne(
            { username: userName },
            function (err, foundUser) {
              if (err) {
                console.log(err);
              } else {
                if (foundUser) {
                  if (foundUser.password === password && foundUser.username) {
                    if (userName == "Admin") {
                      res.redirect("/admin");
                    } else {
                      signupDetails.findOne(
                        { email: userName },
                        function (err, foundUser) {
                          if (err) {
                            console.log(err);
                          } else {
                            if (foundUser) {
                              req.session.userEmail = foundUser.email;
                              req.session.userName = foundUser.name;
                              res.redirect("/rider");
                            }
                          }
                        }
                      );
                    }
                  } else if (foundUser.password != password) {
                    res.render("uorpassIncorrect");
                  }
                }
              }
            }
          );
        }
      });
    }
  });
});

app.get("/signup", guard, function (req, res) {
  res.render("signup");
});

app.post("/signup", function (req, res) {
  var Name = req.body.Name;
  var DOB = req.body.Dob;
  var Gender = req.body.Gender;
  var Email = req.body.email;
  var Phone = req.body.phone;
  var Documenttype = req.body.doctype;
  var Documentnumber = req.body.docno;
  var Password = req.body.pass1;
  var cPassword = req.body.pass2;

  var today = new Date();
  var parts = DOB.split("/");
  var thisYear = today.getFullYear();
  // var thisMonth=today.getMonth();
  // var thisDay=today.getDate();

  var givenYear = parts[2];
  // var givenMonth=parts[1];
  // var givenDay=parts[0];

  if (thisYear < givenYear) {
    res.render("invalidDOB");
  } else {
    var regx = /^[6-9]\d{9}$/;
    if (regx.test(Phone))
      signupDetails.findOne({ email: Email }, function (err, foundUser) {
        if (!foundUser) {
          if (Password != cPassword) {
            console.log("Password does not match");
            res.render("PassNotMatch.ejs");
          } else {
            const signupDetails1 = new signupDetails({
              name: Name,
              dob: DOB,
              gender: Gender,
              email: Email,
              phone: Phone,
              documenttype: Documenttype,
              documentnumber: Documentnumber,
              password: Password,
            });

            signupDetails1.save(function (err, result) {
              if (err) {
                console.log(err);
              } else {
                res.redirect("/");
              }
            });

            const loginDetails1 = new loginDetails({
              username: Email,
              password: Password,
            });

            loginDetails1.save();
          }
        } else {
          console.log("Email Id already Exists!!!");
          res.render("EmailIdAlreadyExists");
        }
      });
    else res.render("invalidPhone");
  }
});

app.get("/logout", auth, function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

app.get("/rider", auth, function (req, res) {
  res.render("rider", {
    userName: req.session.userName,
    mail: req.session.userEmail,
  });
});

app.get("PublishSuccess", function (req, res) {
  res.redirect("/PublishSuccess");
});

app.post("/rider", function (req, res) {});

app.get("/publish", function (req, res) {
  res.render("publish");
});

app.post("/publish", auth, function (req, res) {
  var Source = req.body.source;
  var Destination = req.body.destination;
  var Date1 = req.body.date;
  var Time = req.body.time;
  var Availability = req.body.availability;
  var Fare = req.body.fare;

  var userName = req.session.userEmail;

  var today = new Date();
  var parts = Date1.split("/");

  var givenYear = parts[2];
  var givenMonth = parts[1];
  var givenDay = parts[0];

  var Date2 = new Date(givenYear + "-" + givenMonth + "-" + givenDay);

  if (today > Date2) {
    res.render("DateNotValid");
  } else {
    signupDetails.findOne({ email: userName }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        var Name = foundUser.name;
        var Phone = foundUser.phone;
      }
      const publishDetails1 = new publishDetails({
        name: Name,
        mailid: userName,
        phone: Phone,
        source: Source,
        destination: Destination,
        date: Date1,
        time: Time,
        availability: Availability,
        fare: Fare,
      });
      publishDetails1.save();
      res.render("PublishSuccess");
    });
  }
});

app.get("/admin", function (req, res) {
  res.render("admin");
});

app.get("/publishDetails", function (req, res) {
  publishDetails.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("publishDetails", { result: results });
    }
  });
});

app.get("/riderDetails", function (req, res) {
  signupDetails.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("riderDetails", { result: results });
    }
  });
});
app.listen(3001, function () {
  console.log("Server started on port 3001");
});

app.get("/booking", function (req, res) {
  publishDetails.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("booking", { result: results });
    }
  });
});

app.post("/booking", function (req, res) {
  publishDetails.find(
    { source: req.body.source, destination: req.body.destination },
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        res.render("showAvailables", { result: results });
      }
    }
  );
});

app.post("/showAvailables", function (req, res) {
  var userName = req.session.userEmail;

  const Request1 = new Request({
    name: req.body.riname,
    RequesterMailid: userName,
    PublisherMailid: req.body.rimail,
    source: req.body.risour,
    destination: req.body.ridest,
    date: req.body.ridate,
    time: req.body.ritime,
    fare: req.body.rifare,
    availability: req.body.riavail,
    Selectedseats: req.body.SelectedSeats,
    Status: "Requested",
  });

  Request1.save(function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.render("RequestSuccess");
    }
  });
});

app.get("/requests", function (req, res) {
  var userName = req.session.userEmail;
  Request.find(
    { RequesterMailid: userName, Status: "Requested" },
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        res.render("requests", { result: results });
      }
    }
  );
});

app.get("/requestsforMe", function (req, res) {
  var userName = req.session.userEmail;
  Request.find(
    { PublisherMailid: userName, Status: "Requested" },
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        res.render("requestsforMe", { result: results });
      }
    }
  );
});

app.post("/requestsforMe", function (req, res) {
  Request.findOneAndUpdate(
    {
      RequesterMailid: req.body.requestermailid,
      PublisherMailid: req.body.publishermailid,
      source: req.body.Source,
      destination: req.body.Destination,
      date: req.body.datE,
      time: req.body.timE,
    },
    { $set: { Status: "Accepted" } },
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        publishDetails.findOne(
          {
            mailid: req.body.publishermailid,
            source: req.body.Source,
            destination: req.body.Destination,
            date: req.body.datE,
            time: req.body.timE,
          },
          function (err, findUser) {
            if (err) {
              console.log(err);
            } else {
              let avail =
                parseInt(findUser.availability) - parseInt(req.body.selected);
              publishDetails.findOneAndUpdate(
                {
                  mailid: req.body.publishermailid,
                  source: req.body.Source,
                  destination: req.body.Destination,
                  date: req.body.datE,
                  time: req.body.timE,
                },
                { $set: { availability: avail } },
                function (err, results) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.render("Accepted");
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

app.get("/Acceptedmyrequests", function (req, res) {
  var userName = req.session.userEmail;
  Request.find(
    { RequesterMailid: userName, Status: "Accepted" },
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        res.render("Acceptedmyrequests", { result: results });
      }
    }
  );
});

app.post("/Acceptedmyrequests", function (req, res) {
  var avail = parseInt(req.body.available) + parseInt(req.body.selected);
  publishDetails.findOne(
    {
      mailid: req.body.publishermailid,
      source: req.body.Source,
      destination: req.body.Destination,
      date: req.body.datE,
      time: req.body.timE,
    },
    function (err, findUser) {
      if (err) {
        console.log(err);
      } else {
        let avail =
          parseInt(findUser.availability) + parseInt(req.body.selected);
        publishDetails.findOneAndUpdate(
          {
            mailid: req.body.publishermailid,
            source: req.body.Source,
            destination: req.body.Destination,
            date: req.body.datE,
            time: req.body.timE,
          },
          { $set: { availability: avail } },
          function (err, results) {
            if (err) {
              console.log(err);
            } else {
              Request.findOneAndRemove(
                {
                  RequesterMailid: req.body.requestermailid,
                  PublisherMailid: req.body.publishermailid,
                  source: req.body.Source,
                  destination: req.body.Destination,
                  date: req.body.datE,
                  time: req.body.timE,
                },
                function (err) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.render("AcceptedCanceled");
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

app.get("/myrides", function (req, res) {
  var userName = req.session.userEmail;
  publishDetails.find({ mailid: userName }, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("myrides", { result: results });
    }
  });
});

app.post("/myrides", function (req, res) {
  publishDetails.findOneAndRemove(
    {
      mailid: req.body.Mailid,
      source: req.body.Source,
      destination: req.body.Destination,
      date: req.body.datE,
      time: req.body.timE,
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        Request.findOneAndRemove(
          {
            PublisherMailid: req.body.Mailid,
            source: req.body.Source,
            destination: req.body.Destination,
            date: req.body.datE,
            time: req.body.timE,
          },
          function (err) {
            if (err) {
              console.log(err);
            } else {
              res.render("DeleteRide");
            }
          }
        );
      }
    }
  );
});

app.get("/complaint", function (req, res) {
  signupDetails.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("complaint", { result: results });
    }
  });
});

app.post("/complaint", function (req, res) {
  var Ridermail = req.body.ridermail;
  var description = req.body.desc;

  var userName = req.session.userEmail;

  const complaintRider1 = new complaintRider({
    CompalinteeMailID: userName,
    RiderMailId: Ridermail,
    Description: description,
  });

  complaintRider1.save();
  res.render("Complainted");
});

app.get("/complaintAction", function (req, res) {
  complaintRider.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("complaintAction", { result: results });
    }
  });
});

app.post("/complaintAction", function (req, res) {
  var riderMail = req.body.ridermail;
  signupDetails.findOne({ email: riderMail }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      var Name = foundUser.name;
      var Phone = foundUser.phone;
      var DocumentType = foundUser.documenttype;
      var DocumentNumber = foundUser.documentnumber;
    }
    res.render("ComplaintDetails", {
      name: Name,
      phone: Phone,
      email: riderMail,
      documenttype: DocumentType,
      documentnumber: DocumentNumber,
    });
  });
});

app.post("/suspend", function (req, res) {
  loginDetails.findOne({ username: req.body.rmail }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      var password = foundUser.password;
      signupDetails.findOne(
        { email: req.body.rmail },
        function (err, foundUser) {
          if (err) {
            console.log(err);
          } else {
            var Name = foundUser.name;
            var Phone = foundUser.phone;
            const Suspended1 = new Suspended({
              name: Name,
              mailid: req.body.rmail,
              phone: Phone,
              Password: password,
            });
            Suspended1.save();
            loginDetails.findOneAndRemove(
              { username: req.body.rmail },
              function (err) {
                if (err) {
                  console.log(err);
                } else {
                  complaintRider.findOneAndRemove(
                    { RiderMailId: req.body.rmail },
                    function (err) {
                      if (err) {
                        console.log(err);
                      } else {
                        res.render("suspend");
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    }
  });
});

app.post("/remove", function (req, res) {
  signupDetails.findOne({ email: req.body.rmail }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      var Name = foundUser.name;
      var Phone = foundUser.phone;
    }
    const Removed1 = new Removed({
      name: Name,
      mailid: req.body.rmail,
      phone: Phone,
    });
    Removed1.save();
    loginDetails.findOneAndRemove({ username: req.body.rmail }, function (err) {
      if (err) {
        console.log(err);
      } else {
        signupDetails.findOneAndRemove(
          { email: req.body.rmail },
          function (err) {
            if (err) {
              console.log(err);
            } else {
              complaintRider.findOneAndRemove(
                { RiderMailId: req.body.rmail },
                function (err) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.render("remove");
                  }
                }
              );
            }
          }
        );
      }
    });
  });
});

app.get("/RemovedRiders", function (req, res) {
  Removed.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("RemovedRiders", { result: results });
    }
  });
});

app.get("/SuspendedRiders", function (req, res) {
  Suspended.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("SuspendedRiders", { result: results });
    }
  });
});

app.post("/Unsuspend", function (req, res) {
  var rmail = req.body.ridermail;
  console.log(rmail);
  Suspended.findOne({ mailid: rmail }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const loginDetails2 = new loginDetails({
        username: rmail,
        password: foundUser.Password,
      });
      loginDetails2.save();
      Suspended.findOneAndRemove({ mailid: rmail }, function (err) {
        if (err) {
          console.log(err);
        } else {
          res.render("Unsuspend");
        }
      });
    }
  });
});
