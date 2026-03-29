const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
require('dotenv').config();
const Topic = require('../models/Problem.model');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI must be provided in .env');
  process.exit(1);
}
const QUESTIONS_DIR = path.join(__dirname, '../../../packages/questions');

// Mapping Polygon tags to roadmap topics
const TAG_MAP = {
  'hasing': 'Hash Table',
  'hash': 'Hash Table',
  'strings': 'String',
  'string': 'String',
  'arrays': 'Array',
  'array': 'Array',
  'sorting': 'Sorting',
  'greedy': 'Greedy',
  'dp': 'Dynamic Programming',
  'dynamic programming': 'Dynamic Programming',
  'graphs': 'Graph',
  'graph': 'Graph',
  'trees': 'Tree',
  'queue': 'Stack & Queue',
  'stack': 'Stack & Queue',
  'stacks': 'Stack & Queue',
  'deque': 'Stack & Queue',
  'tree': 'Tree',
  'two pointers': 'Two Pointers',
  'sliding window': 'Sliding Window',
  'search': 'Binary Search',
  'backtracking': 'Backtracking'
};

async function processPolygonDirectory(sourceDir) {
  // 1. Parse problem.xml
  const xmlContent = fs.readFileSync(path.join(sourceDir, 'problem.xml'), 'utf-8');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlContent);
  
  const problem = result.problem;
  const title = problem.names[0].name[0].$.value;
  const timeLimit = parseInt(problem.judging[0].testset[0]['time-limit'][0]);
  const memoryLimit = parseInt(problem.judging[0].testset[0]['memory-limit'][0]);
  const tags = (problem.tags && problem.tags[0].tag) ? problem.tags[0].tag.map(t => t.$.value) : [];
  
  // Determine Topic & Difficulty
  const topicName = TAG_MAP[tags[0]?.toLowerCase()] || 'Array';
  const difficultyLevel = 'Hard'; // Defaulting to Medium
  
  // 2. Parse problem.tex for description
  const texPath = path.join(sourceDir, 'statements/english/problem.tex');
  const tutorialPath = path.join(sourceDir, 'statements/english/tutorial.tex');
  let description = '';
  let constraints = [];
  
  if (fs.existsSync(texPath)) {
    const texContent = fs.readFileSync(texPath, 'utf-8');
    
    // Updated robust regexes to grab content using positive lookaheads for optional sections.
    const statementMatch = texContent.match(/\\begin\{problem\}\{.*?\}.*?\n([\s\S]*?)(?=\\InputFile|\\OutputFile|\\Note|\\end\{problem\})/s);
    const inputMatch = texContent.match(/\\InputFile\n([\s\S]*?)(?=\\OutputFile|\\Note|\\end\{problem\})/s);
    const outputMatch = texContent.match(/\\OutputFile\n([\s\S]*?)(?=\\Note|\\end\{problem\})/s);
    const noteMatch = texContent.match(/\\Note\n([\s\S]*?)(?=\\end\{problem\})/s);

    const cleanText = (text) => text ? text.replace(/\\%/g, '%').trim() : '';

    const stateText = cleanText(statementMatch?.[1]);
    
    description = stateText;
    
    if (noteMatch && noteMatch[1]) {
      constraints = noteMatch[1].split('\n')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map(c => c.replace(/\\%/g, '%'));
    }
  }

  // Look for example in tutorial.tex
  let exampleText = '';
  if (fs.existsSync(tutorialPath)) {
    const tutorialContent = fs.readFileSync(tutorialPath, 'utf-8');
    const tutorialMatch = tutorialContent.match(/\\begin\{tutorial\}\{.*?\}.*?\n([\s\S]*?)(?:\\end\{tutorial\})/s);
    if (tutorialMatch && tutorialMatch[1]) {
      exampleText = tutorialMatch[1].replace(/\\%/g, '%').trim();
    }
  }

  // 3. Extract Test Cases (top 2 as samples)
  const testsDir = path.join(sourceDir, 'tests');
  
  // Test Generation Fallback (if they don't exist yet)
  if (!fs.existsSync(testsDir) || fs.readdirSync(testsDir).length === 0) {
    const { execSync } = require('child_process');
    if (fs.existsSync(path.join(sourceDir, 'doall.bat'))) {
      try {
        console.log(`Generating test cases for ${title}...`);
        execSync('cmd.exe /c doall.bat', { cwd: sourceDir, stdio: 'ignore' });
      } catch (e) {
        console.warn('Test generation might have failed or partially succeeded.');
      }
    } else if (fs.existsSync(path.join(sourceDir, 'doall.sh'))) {
      try {
        console.log(`Generating test cases for ${title}...`);
        execSync('bash doall.sh', { cwd: sourceDir, stdio: 'ignore' });
      } catch (e) {
        console.warn('Test generation might have failed or partially succeeded.');
      }
    }
  }

  const testCases = [];
  let totalTestSize = 0;
  const sizeLimit = 2 * 1024 * 1024; // 2MB limit per problem to prevent MongoDB BSON RangeError on Topic saves
  
  if (fs.existsSync(testsDir)) {
    const files = fs.readdirSync(testsDir).sort((a,b) => {
      // Sort numerically if files are named like 1, 2, 3 so we get smaller/earlier test cases first
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return (Number.isNaN(numA) || Number.isNaN(numB)) ? a.localeCompare(b) : numA - numB;
    });
    
    for (const file of files) {
      if (!file.includes('.') && fs.existsSync(path.join(testsDir, file + '.a'))) {
        const input = fs.readFileSync(path.join(testsDir, file), 'utf-8').trim();
        const output = fs.readFileSync(path.join(testsDir, file + '.a'), 'utf-8').trim();
        
        const currentSize = Buffer.byteLength(input, 'utf-8') + Buffer.byteLength(output, 'utf-8');
        if (totalTestSize + currentSize > sizeLimit) {
          console.warn(`Skipping remaining test cases for ${title}: Exceeded 2MB limit (BSON Error mitigation)`);
          break;
        }
        totalTestSize += currentSize;
        
        testCases.push({
          input: input,
          expectedOutput: output,
          hidden: testCases.length >= 2 // Mark others as hidden
        });
      }
    }
  }
  
  // 4. Extract Solution
  const solutionPath = path.join(sourceDir, 'solutions/solution.cpp');
  let solutionCode = '';
  if (fs.existsSync(solutionPath)) {
    solutionCode = fs.readFileSync(solutionPath, 'utf-8');
  }
  
  // 5. Database Ops
  await Topic.init(); // Ensure model is initialized
  
  let topicDoc = await Topic.findOne({ name: topicName });
  if (!topicDoc) {
    topicDoc = new Topic({ name: topicName, difficulties: [
      { level: 'Easy', questions: [] },
      { level: 'Medium', questions: [] },
      { level: 'Hard', questions: [] }
    ]});
  }
  
  const diffSection = topicDoc.difficulties.find(d => d.level === difficultyLevel);
  
  // Get next serialNo
  const allTopics = await Topic.find({}).lean();
  let maxSerial = 0;
  allTopics.forEach(t => {
    t.difficulties.forEach(d => {
      d.questions.forEach(q => {
        if (q.serialNo > maxSerial) maxSerial = q.serialNo;
      });
    });
  });
  
  const newQuestion = {
    serialNo: maxSerial + 1,
    title: title,
    acceptance: (Math.random() * 20 + 40).toFixed(1) + '%', // Random fallback
    link: problem.$.url || '',
    description: description,
    example: exampleText,
    constraints: constraints,
    testCases: testCases,
    timeLimit: timeLimit || 1000,
    memoryLimit: memoryLimit || 268435456,
    solution: {
      language: 'cpp',
      code: solutionCode,
      timeComplexity: 'O(?)', // Manual entry usually needed
      spaceComplexity: 'O(?)',
      explanation: 'Imported from Polygon'
    },
    generatedAt: new Date()
  };
  
  const existingIndex = diffSection.questions.findIndex(q => q.title === title);
  if (existingIndex >= 0) {
    console.log(`Updating existing question: ${title}`);
    newQuestion.serialNo = diffSection.questions[existingIndex].serialNo;
    diffSection.questions[existingIndex] = newQuestion;
  } else {
    diffSection.questions.push(newQuestion);
  }
  
  await topicDoc.save();
  
  console.log(`Successfully imported: ${title} into ${topicName} [${difficultyLevel}]`);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas');
  
  const files = fs.readdirSync(QUESTIONS_DIR);
  for (const file of files) {
    const fullPath = path.join(QUESTIONS_DIR, file);
    
    if (file.endsWith('.zip')) {
      console.log(`Processing ZIP ${file}...`);
      const zip = new AdmZip(fullPath);
      const tempDir = path.join(__dirname, 'temp_unzip_' + Date.now());
      try {
        zip.extractAllTo(tempDir, true);
        await processPolygonDirectory(tempDir);
      } finally {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    } else if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'problem.xml'))) {
      console.log(`Processing Folder ${file}...`);
      await processPolygonDirectory(fullPath);
    }
  }
  
  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(console.error);
