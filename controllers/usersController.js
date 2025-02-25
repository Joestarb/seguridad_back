  const db = require("../models/database");
  const jwt = require("jsonwebtoken");
  const obtenerPasswordAleatoria = require("../utils/randomPassword");

  const JWT_SECRET = obtenerPasswordAleatoria();

  exports.registerUser = (req, res) => {
    const { email, password, role = 'user' } = req.body;  // Añadir role con valor por defecto 'user'
    if (!email || !password) {
      return res.status(400).json({ error: "email y password son requeridos" });
    }


    const checkUserQuery = `SELECT * FROM users WHERE email = ?`;
    db.get(checkUserQuery, [email], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: "El usuario ya existe" });

      const insertUserQuery = `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`;
      db.run(insertUserQuery, [email, password, role], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ id: this.lastID, email, role });
      });
    });
  };

  exports.loginUser = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email y password son requeridos" });
    }

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
    console.log(query)
    db.get(query, [email, password], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Credenciales inválidas" });

      const token = jwt.sign({ email, role: row.role }, JWT_SECRET); // firmamos el jwt

      const insertSessionQuery = `INSERT INTO sessions (user_id, token) VALUES (?, ?)`;
      db.run(insertSessionQuery, [email, token], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ id: row.id, token, role: row.role });
      });
    });
  };

  exports.logoutUser = (req, res) => {
    const token = req.body.token;
    const query = `DELETE FROM sessions WHERE token = ?`;
    db.run(query, [token], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ deleted: this.changes });
    });
  }

  exports.getUserById = (req, res) => {
    const id = req.params.id;
    const query = `SELECT * FROM users WHERE id = ${id}`;
    db.get(query, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  };

  exports.validateToken = (req, res) => {
    const token = req.query.token;
    const query = `SELECT * FROM sessions WHERE token = ?`;
    db.get(query, [token], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        res.json({ valid: true, session: row });
      } else {
        res.status(401).json({ valid: false, message: 'Invalid token' });
      }
    });
  };


