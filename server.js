const express = require("express");
const app = express();
// exports.app = app;
// Same as above two line written.!
// const app = exports.app = express()
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const {
    userRegisteration,
    finduser,
    addProfile,
    getUserInfoForEdit,
    updateUserInfo,
    updateUserPassword,
    updateUserProfile,
    addSignature,
    getSignature,
    getFirstAndLastNames,
    getUsersByCity,
    deleteUserSignature,
} = require("./db");
const csurf = require("csurf");

const { hash, compare } = require("./utils/bc");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(express.static("public"));
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(
    cookieSession({
        secret: process.env.COOKIE_SECRET || require("./secrets").COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14, // After two week, cookies will be reset
    })
);

// csurf MUST come after cookieSession
app.use(csurf()); // looking for the every request and look at the csurf token and if the valid token

app.use(function (req, res, next) {
    // this prevents clicking jacking
    res.setHeader("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken(); // generating the CSRF token and store it into var csrfToken
    next();
});

// Checking for the cookies
app.use((req, res, next) => {
    const request = [
        "/profile",
        "/profile/edit",
        "/petitions",
        "/thanks",
        "/signers",
        "/logout",
    ];
    if (request.includes(req.url) && !req.session.userId) {
        return res.redirect("/login");
    } else if (
        (req.url === "/registeration" || req.url === "/login") &&
        req.session.userId
    ) {
        return res.redirect("/petitions");
    }
    next();
});

// Get for Home route
app.get("/", (req, res) => {
    console.log("Get Route Req");
    res.redirect("/registeration");
});

// Registerations
app.get("/registeration", (req, res) => {
    console.log("GET request to /registration page was made");
    res.render("registeration", {
        layout: "main",
    });
});

app.post("/registeration", (req, res) => {
    console.log("POST request to /registration page was made");
    // Hashing Password (note:hash_password is simple user password input)
    hash(req.body.hash_password)
        .then((hashed_password) => {
            console.log(hashed_password);
            userRegisteration(
                req.body.first_name,
                req.body.last_name,
                req.body.email,
                hashed_password
            )
                .then((results) => {
                    req.session.userId = results.rows[0].id;
                    res.redirect("/profile");
                })
                .catch((error) => {
                    console.log("error in registration route", error);
                    res.render("registeration", {
                        layout: "main",
                        error: "Something wrong happened, try again",
                    });
                });
        })
        .catch((error) => console.log(error));
});

// Login Page

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    console.log("POST req to /login page was done");
    finduser(req.body.email).then((results) => {
        console.log("results.rows:", results.rows);
        // checking wether user exists for this email - if there is no user then render login page again
        if (results.rows.length === 0) {
            res.render("login", {
                layout: "main",
                noUser: true,
            });
            return;
        }
        compare(req.body.hash_password, results.rows[0].hash_password)
            .then((match) => {
                console.log("Password matched:", match);
                if (match === true) {
                    req.session.userId = results.rows[0].id;
                    res.redirect("/petitions");
                } else {
                    res.render("login", {
                        layout: "main",
                        wrongPassword: true,
                    });
                }
            })
            .catch((error) => {
                console.log("Error in POST /login route:", error);
                res.render("login", {
                    layout: "main",
                    error: true,
                });
            });
    });
});

//Profile
app.get("/profile", (req, res) => {
    console.log(" GET req was was to /profile route");
    if (req.session.userId) {
        res.render("profile", {
            layout: "main",
        });
    }
});

app.post("/profile", (req, res) => {
    console.log("req POST /profile");
    const { userId } = req.session;
    let { age, city, url } = req.body;
    console.log("req.body:", req.body);
    console.log("age.length:", age);
    console.log("city.length:", city);
    console.log("url.length:", url);
    if (
        url.length !== 0 &&
        !url.startsWith("https://") &&
        !url.startsWith("http://")
    ) {
        url = `http://${url}`;
    }
    addProfile(
        userId,
        age.length !== 0 ? age : null,
        city.length !== 0 ? city : null,
        url.length !== 0 ? url : null
    )
        .then(() => {
            res.redirect("/petitions");
        })
        .catch((error) => {
            console.log("error", error);
            res.redirect("profile", {
                layout: "main",
                errorInProfile: "Please try again.",
            });
        });
});

// Profile editing
app.get("/profile/edit", (req, res) => {
    console.log("a GET req was made from /profile/edit route");
    console.log("req.session.userId", req.session.userId);
    // res.render("edit");
    getUserInfoForEdit(req.session.userId)
        .then((results) => {
            console.log(results.rows);
            res.render("edit", {
                layout: "main",
                userInfo: results.rows,
            });
        })
        .catch((error) => {
            console.log("error", error);
        });
});

app.post("/profile/edit", (req, res) => {
    console.log("a POST req was made from /profile/edit route");
    console.log("req.body.hash_password.length", req.body.hash_password.length);
    const { userId } = req.session;
    const {
        first_name,
        last_name,
        email,
        hash_password,
        age,
        city,
        url,
    } = req.body;
    if (hash_password.length !== 0) {
        console.log("Updating the Password");
        hash(hash_password).then((hashed_password) => {
            console.log("hashed_password", hashed_password);
            Promise.all([
                updateUserInfo(first_name, last_name, email, userId),
                updateUserPassword(hashed_password, userId),
                updateUserProfile(age, city, url, userId),
            ])
                .then(() => {
                    res.redirect("/thanks", {
                        layout: "main",
                    });
                })
                .catch((error) => {
                    console.log("error:", error);
                });
        });
    } else {
        console.log("password was not updated");
        Promise.all([
            updateUserProfile(first_name, last_name, email, userId),
            updateUserProfile(age, city, url, userId),
        ]).then(() => {
            res.redirect("/thanks", {
                layout: "main",
            }).catch((error) => {
                console.log("error:", error);
            });
        });
    }
});

// Signing for petition..!
app.get("/petitions", (req, res) => {
    console.log("Request has been made to petition");
    console.log("req.session", req.session);
    getSignature(req.session.signatureId);
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petitions");
    }
});

app.post("/petitions", (req, res) => {
    const { userId } = req.session;
    const { signature } = req.body;
    // if (signature == "") signature = "test";
    console.log("req.body:", req.body);
    console.log("signature : ", signature);
    addSignature(userId, signature)
        .then((results) => {
            req.session.signatureId = results.rows[0].id;
            console.log(
                "req.session.signatureId set to:",
                req.session.signatureId
            );
            res.redirect("/thanks");
        })
        .catch((error) => {
            console.log("error", error);
            res.render("petitions", {
                layout: "main",
                error: true,
            });
        });
    // console.log("A post request was made from Petition");
    // res.send("Post request is working");
});

// Thanks page
// app.get("/thanks", (req, res) => {
//     res.render("thanks");
// });

app.get("/thanks", (req, res) => {
    console.log("a GET req was made to /thanks route");
    console.log("req.session.signatureId:", req.session.signatureId);
    console.log("req.session.", req.session);
    if (!req.session.signatureId) {
        res.redirect("/");
    } else {
        getSignature(req.session.userId) // userId is the argument passed in module.export.getSignature
            .then((results) => {
                const { signature } = results.rows[0];
                res.render("thanks", {
                    signature: signature,
                });
            })
            .catch((error) => {
                console.log("error in /thanks routes:", error);
            });
    }
});
app.post("/thanks", (req, res) => {
    console.log("a POST request was made to /thanks route");
    console.log("req.session.userId", req.session.userId);
    console.log("req.session.signatureId", req.session.signatureId);
    deleteUserSignature(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petitions");
        })
        .catch((error) => console.log("error", error));
});

// Signers
app.get("/signers", (req, res) => {
    // const { signatureId } = req.session;
    console.log("Signer page is up and working");
    getSignature(req.session.userId)
        .then((results) => {
            console.log("results.rows.length", results.rows.length);
            console.log("results.rowCount", results.rowCount);

            if (results.rows.length === 0) {
                return res.redirect("/petitions");
            }
            getFirstAndLastNames()
                .then((results) => {
                    res.render("signers", {
                        layout: "main",
                        signers: results.rows,
                        totalSigners: results.rowCount,
                    });
                })
                .catch((error) => console.log("error"));
        })
        .catch((error) => console.log(error));
});

app.get("/signers/:city", (req, res) => {
    console.log("GET req was made to /signers/:city route");
    getSignature(req.session.userId)
        .then((results) => {
            if (results.rows.length === 0) {
                return res.redirect("/petitions");
            }
            getUsersByCity(req.params.city).then((results) => {
                return res.render("signers", {
                    layout: "main",
                    signers: results.rows,
                    belongToCity: req.params.city,
                });
            });
        })
        .catch((error) => {
            console.log("error:", error);
        });
});

// Logout Route
app.get("/logout", (req, res) => {
    req.session.signatureId = null;
    req.session.userId = null;
    res.redirect("login");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("Pettion is running and UP")
);
