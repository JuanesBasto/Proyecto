const express = require("express");
const {
  vistaInicio,
  vistaPrincipal,
  vistaTables,
  vistaNotifications,
} = require("../controllers/PageControllers");
const router = express.Router();

router.get("/", vistaInicio);
router.get("/home", vistaPrincipal)
router.get("/tables", vistaTables);
router.get("/notifications", vistaNotifications);

module.exports = { routes: router };
