const fs = require('fs');
const path = require('path');

const tablePath = path.join(__dirname, '..', 'docs', 'table.md');
const raw = fs.readFileSync(tablePath, 'utf8');

const rows = raw
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('|') && !line.includes('---'))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

if (rows.length < 2) {
  console.error('No data rows found in table.md');
  process.exit(1);
}

const header = rows[0].map((h) => h.toLowerCase());
const data = rows.slice(1).map((cols, index) => {
  const row = {};
  header.forEach((key, i) => {
    row[key] = cols[i];
  });
  row.__index = index + 1; // 1-based data row index
  return row;
});

const toBit = (value) => (value === '1' || value === 'high' ? 1 : 0);

let q1 = 0;
let q2 = 0;
let prevClock = null;
let failures = 0;

for (const row of data) {
  const clock = toBit(row.clock);

  if (prevClock === 1 && clock === 0) {
    const prevQ1 = q1;
    q1 = q1 ? 0 : 1;
    if (prevQ1 === 1 && q1 === 0) {
      q2 = q2 ? 0 : 1;
    }
  }

  const clk1 = clock;
  const clk2 = q1;

  const expected = {
    clk1: toBit(row.clk1),
    q1: toBit(row.q1),
    clk2: toBit(row.clk2),
    q2: toBit(row.q2),
  };

  const actual = { clk1, q1, clk2, q2 };

  const ok = Object.keys(expected).every((key) => expected[key] === actual[key]);
  if (!ok) {
    failures += 1;
    console.log(
      `Row ${row.__index}: expected clk1=${expected.clk1} q1=${expected.q1} clk2=${expected.clk2} q2=${expected.q2} ` +
        `but got clk1=${actual.clk1} q1=${actual.q1} clk2=${actual.clk2} q2=${actual.q2}`
    );
  }

  prevClock = clock;
}

if (failures === 0) {
  console.log('PASS: M113 sequence matches table.md');
} else {
  console.error(`FAIL: ${failures} row(s) mismatched.`);
  process.exit(1);
}
