import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use((req, res, next) => {
  next();
});

app.get('/api/token-data', (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  const possiblePaths = [
    path.join(__dirname, '../ai_analyzer.json'),
  ];
  
  let filePath: string | null = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      filePath = testPath;
      break;
    }
  }
  
  if (!filePath) {
    console.error('ai_analyzer.json not found in any of these paths:');
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    return res.status(404).json({ 
      error: 'Token data file not found', 
      data: [],
      searchedPaths: possiblePaths 
    });
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    let jsonData = JSON.parse(data);
    let allTokens: any[] = [];
    if (Array.isArray(jsonData.results)) {
      allTokens = jsonData.results;
    } else if (Array.isArray(jsonData.data)) {
      allTokens = jsonData.data;
    } else if (Array.isArray(jsonData)) {
      allTokens = jsonData;
    } else {
      console.error('Unexpected data structure:', Object.keys(jsonData));
      return res.status(500).json({ 
        error: 'Unexpected data structure', 
        data: [],
        structure: Object.keys(jsonData)
      });
    }
    
    const completeTokens = allTokens.filter((token: any) => {
      const hasSymbol = token.symbol && typeof token.symbol === 'string';
      const hasRisk = typeof token.risk === 'number' && !isNaN(token.risk);
      const hasPotential = typeof token.potential === 'number' && !isNaN(token.potential);
      const isComplete = hasSymbol && hasRisk && hasPotential;
      
      if (!isComplete) {
        console.log('Incomplete token:', {
          symbol: token.symbol,
          hasSymbol,
          hasRisk,
          hasPotential,
          risk: token.risk,
          potential: token.potential
        });
      }
      return isComplete;
    });
    
    const transformedTokens = completeTokens.map(token => ({
      ...token,
      investmentPotential: token.potential || token.investmentPotential,
      rationale: token.rationale || `Risk: ${token.risk}/10, Potential: ${token.potential || token.investmentPotential}/10`
    }));
    res.json({ results: transformedTokens });
  } catch (err) {
    console.error('Error parsing token data:', err);
    res.status(500).json({ 
      error: 'Failed to parse token data', 
      data: [],
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Token data: http://localhost:${PORT}/api/token-data`);
});