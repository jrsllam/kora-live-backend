
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Helper functions for case conversion ---
const toCamelCase = (str) => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const convertKeysToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => convertKeysToCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toCamelCase(key)] = convertKeysToCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

const convertKeysToSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => convertKeysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toSnakeCase(key)] = convertKeysToSnakeCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
}


// --- Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Used by hosting services like Render/Cyclic
  // --- Local connection settings (use these if DATABASE_URL is not set) ---
  user: 'postgres',         //  أو اسم المستخدم الخاص بك
  host: 'localhost',
  database: 'kora_live',
  password: '123132OoO', //  !!! استبدل هذا بكلمة المرور الخاصة بك !!!
  port: 5432,
  // --- SSL setting for production (often required by hosting services) ---
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database!');
  client.release();
});


app.use(cors());
app.use(express.json());


// --- API Endpoints ---

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// GET all data
app.get('/api/leagues', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leagues ORDER BY name');
        res.json(convertKeysToCamelCase(result.rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/teams', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams ORDER BY name');
        res.json(convertKeysToCamelCase(result.rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/matches', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM matches ORDER BY date_time DESC NULLS LAST');
        res.json(convertKeysToCamelCase(result.rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM news ORDER BY date DESC');
        res.json(convertKeysToCamelCase(result.rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST (Add new)
app.post('/api/leagues', async (req, res) => {
    const { name } = req.body;
    const newId = `l${Date.now()}`;
    try {
        const result = await pool.query(
            'INSERT INTO leagues (id, name) VALUES ($1, $2) RETURNING *',
            [newId, name]
        );
        res.status(201).json(convertKeysToCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/teams', async (req, res) => {
    const { name, logo } = req.body;
    const newId = `t${Date.now()}`;
    try {
        const result = await pool.query(
            'INSERT INTO teams (id, name, logo) VALUES ($1, $2, $3) RETURNING *',
            [newId, name, logo]
        );
        res.status(201).json(convertKeysToCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/matches', async (req, res) => {
    const dbPayload = convertKeysToSnakeCase(req.body);
    const newId = `m${Date.now()}`;
    try {
        const result = await pool.query(
            'INSERT INTO matches (id, league_id, home_team_id, away_team_id, date_time, stadium, broadcasters, status, home_score, away_score, events, current_half, timer_running, timer_start_time, elapsed_seconds, first_half_extra_time, second_half_extra_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *',
            [newId, dbPayload.league_id, dbPayload.home_team_id, dbPayload.away_team_id, dbPayload.date_time, dbPayload.stadium, dbPayload.broadcasters, dbPayload.status, dbPayload.home_score, dbPayload.away_score, JSON.stringify(dbPayload.events || []), dbPayload.current_half, dbPayload.timer_running, dbPayload.timer_start_time, dbPayload.elapsed_seconds, dbPayload.first_half_extra_time, dbPayload.second_half_extra_time]
        );
        res.status(201).json(convertKeysToCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT (Update)
app.put('/api/matches/:id', async (req, res) => {
    const { id } = req.params;
    const clientPayload = req.body;

    try {
        // Fetch the current state from DB
        const currentStateResult = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
        if (currentStateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        const currentState = currentStateResult.rows[0];

        // --- Smart Timer Logic ---
        let elapsedSeconds = currentState.elapsed_seconds;
        // If timer was running and frontend wants to stop it
        if (currentState.timer_running && !clientPayload.timerRunning) {
            const startTime = new Date(currentState.timer_start_time).getTime();
            const now = Date.now();
            const diffSeconds = Math.floor((now - startTime) / 1000);
            elapsedSeconds = (currentState.elapsed_seconds || 0) + diffSeconds;
        }

        const dbPayload = {
            ...convertKeysToSnakeCase(clientPayload),
            elapsed_seconds: elapsedSeconds 
        };
        
        const result = await pool.query(
            `UPDATE matches SET 
                date_time = $1, status = $2, home_score = $3, away_score = $4, events = $5,
                current_half = $6, timer_running = $7, timer_start_time = $8, elapsed_seconds = $9,
                first_half_extra_time = $10, second_half_extra_time = $11, stadium = $12, broadcasters = $13,
                league_id = $14, home_team_id = $15, away_team_id = $16
             WHERE id = $17 RETURNING *`,
            [
                dbPayload.date_time, dbPayload.status, dbPayload.home_score, dbPayload.away_score, JSON.stringify(dbPayload.events || '[]'),
                dbPayload.current_half, dbPayload.timer_running, dbPayload.timer_start_time, dbPayload.elapsed_seconds,
                dbPayload.first_half_extra_time, dbPayload.second_half_extra_time, dbPayload.stadium, dbPayload.broadcasters,
                dbPayload.league_id, dbPayload.home_team_id, dbPayload.away_team_id,
                id
            ]
        );
        res.json(convertKeysToCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE
app.delete('/api/leagues/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM leagues WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete('/api/teams/:id', async (req, res) => {
     try {
        await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete('/api/matches/:id', async (req, res) => {
     try {
        await pool.query('DELETE FROM matches WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
