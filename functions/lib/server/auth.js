"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
const storage_1 = require("./storage");
function setupAuth(app) {
    const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
    const sessionSettings = {
        secret: process.env.SESSION_SECRET || "r3pl1t",
        resave: false,
        saveUninitialized: false,
        cookie: {},
        store: new MemoryStore({
            checkPeriod: 86400000,
        }),
    };
    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
        sessionSettings.cookie = {
            secure: true,
        };
    }
    app.use((0, express_session_1.default)(sessionSettings));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.use(new passport_local_1.Strategy(async (username, password, done) => {
        const user = await storage_1.storage.getUserByUsername(username);
        if (!user) {
            return done(null, false, { message: "Utente non presente! Si prega di registrarsi per poter accedere!" });
        }
        if (user.password !== password) {
            return done(null, false, { message: "Password errata! Si prega di riprovare!" });
        }
        return done(null, user);
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(async (id, done) => {
        const user = await storage_1.storage.getUser(id);
        done(null, user);
    });
    app.post("/api/register", async (req, res, next) => {
        try {
            const existingUser = await storage_1.storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).send("Username already exists");
            }
            const user = await storage_1.storage.createUser(req.body);
            req.login(user, (err) => {
                if (err)
                    return next(err);
                res.status(201).json(user);
            });
        }
        catch (err) {
            next(err);
        }
    });
    app.post("/api/login", (req, res, next) => {
        passport_1.default.authenticate("local", (err, user, info) => {
            if (err)
                return next(err);
            if (!user) {
                return res.status(401).send(info?.message || "Errore di autenticazione");
            }
            req.login(user, (err) => {
                if (err)
                    return next(err);
                res.status(200).json(user);
            });
        })(req, res, next);
    });
    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err)
                return next(err);
            res.sendStatus(200);
        });
    });
    app.get("/api/user", (req, res) => {
        if (req.isAuthenticated()) {
            return res.json(req.user);
        }
        res.status(401).send("Unauthorized");
    });
}
