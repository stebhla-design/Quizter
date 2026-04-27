import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const QUIZZES_FILE = path.join(__dirname, 'data', 'quizzes.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// POST endpoint to create a quiz
app.post('/quizzes/create', (req, res) => {
  try {
    const newQuiz = req.body;
    
    // Add unique ID
    newQuiz.id = Date.now().toString();

    let quizzes = [];
    if (fs.existsSync(QUIZZES_FILE)) {
      const data = fs.readFileSync(QUIZZES_FILE, 'utf8');
      quizzes = JSON.parse(data);
    }

    quizzes.push(newQuiz);
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2));

    console.log(`New quiz created: ${newQuiz.title}`);
    res.status(201).json({ message: 'Quiz created successfully', quiz: newQuiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET endpoint to retrieve all quizzes
app.get('/quizzes', (req, res) => {
  try {
    if (fs.existsSync(QUIZZES_FILE)) {
      const data = fs.readFileSync(QUIZZES_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Quizter Backend running at http://localhost:${PORT}`);
});
