if (process.env.NODE_ENV !== "production")
    require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoDBStore = require('connect-mongo')(session);
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require("helmet");
const mongoSanitize = require('express-mongo-sanitize');
const contentPolicy = require("./utils/contentSecurityPolicy");
const app = express();

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");

// Mongo Connection
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// App Config
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(methodOverride("_method"));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
// To remove data, use:
app.use(mongoSanitize());
// Or, to replace prohibited characters with _, use:
app.use(mongoSanitize({
    replaceWith: '_'
}));

app.use(helmet());
app.use(helmet.contentSecurityPolicy(contentPolicy));

const secret = process.env.SECRET || "moneyheist";

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

const sessionConfig = {
    store,
    secret,
    name: "yelpsession",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    if (!['/login', '/register', '/'].includes(req.originalUrl)) {
        req.session.returnTo = req.originalUrl;
    }
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Routes
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/favicon.ico", (req, res) => {
    res.sendStatus(404);
});

// Campground Routes
app.use("/campgrounds", campgroundRoutes);

// Review Routes
app.use("/campgrounds/:id/reviews", reviewRoutes);

//User Routes
app.use("/", userRoutes);

app.all("*", (req, res, next) => {
    next(new ExpressError(400, "Page Not Found"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message)
        err.message = "Something Went Wrong";
    res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server is Up and Running");
});