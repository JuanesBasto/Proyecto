// 1. Invocamos a express
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// 2. Seteamos urlencoded para capturar los datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 3. Invocamos a dotenv
const dotenv = require("dotenv");
dotenv.config({ path: "./env/.env" });

// 4. Directorio public
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));
app.use(express.static(path.join(__dirname, "public")));

// 5. Establecer el motor de plantillas
app.set("view engine", "ejs");
app.use(expressLayouts);

// 6. Invocamos el bcryptjs
const bcryptjs = require("bcryptjs");

// 7. Var. de session
const session = require("express-session");
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// 8. Invocamos el módulo de conexión de la bd
const connection = require("./Database/db");
const { title } = require("process");

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
  if (req.session.loggedin) {
    if (req.session.role === "paciente") {
      req.layout = "layout-paciente"; //establecer un layout para el usuario paciente
    } else if (req.session.role === "administrador") {
      req.layout = "layout"; // Establecer el layout predeterminado
    } else if (req.session.role === "empleado") {
      req.layout = "layout-empleado"; //establecer un layout para el rol empleado
    }
    return next();
  } else {
    res.redirect("/login");
  }
};

// 9. Estableciendo las rutas

// Ruta para la página de inicio de sesión (sin layout)
app.get("/login", (req, res) => {
  res.render("login", { layout: false });
});

// Ruta para la página de registro
app.get("/register", (req, res, next) => {
  res.render("register");
});

// Rutas protegidas con el middleware ensureAuthenticated
app.get("/home", ensureAuthenticated, (req, res) => {
  res.render("home", {
    layout: req.layout, //usar el layout establecido por el middleware
    login: true,
    name: req.session.name,
    role: req.session.rol,
  });
});

app.get("/tables", ensureAuthenticated, (req, res) => {
  res.render("tables");
  layout: req.layout;
});

app.get("/notifications", ensureAuthenticated, (req, res) => {
  res.render("notifications");
  layout: req.layout;
});

// Registro
app.post("/register", async (req, res) => {
  const user = req.body.user;
  const name = req.body.name;
  const rol = req.body.rol;
  const pass = req.body.pass;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  connection.query(
    "INSERT INTO user SET ?",
    { user: user, name: name, rol: rol, pass: passwordHaash },
    async (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.render("register", {
          alert: true,
          alertTitle: "Registration",
          alertMessage: "¡Successful Registration!",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 1500,
          ruta: "register",
        });
      }
    }
  );
});

// Autenticación
app.post("/auth", async (req, res) => {
  const user = req.body.user;
  const pass = req.body.pass;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  if (user && pass) {
    connection.query(
      "SELECT * FROM user WHERE user = ?",
      [user],
      async (error, results) => {
        if (
          results.length == 0 ||
          !(await bcryptjs.compare(pass, results[0].pass))
        ) {
          res.render("login", {
            layout: false,
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o contraseña incorrectas",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;
          req.session.name = results[0].name;
          req.session.role = results[0].rol; // Almacenar el rol en la sesión
          res.render("login", {
            layout: false,
            alert: true,
            alertTitle: "Conexion exitosa",
            alertMessage: "¡LOGIN CORRECTO!",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: "home",
          });
        }
      }
    );
  } else {
    res.render("login", {
      layout: false,
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "¡Por favor ingrese un usuario y/o password!",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(port, (req, res) => {
  console.log("SERVER RUNNING IN https://localhost:3000");
});
