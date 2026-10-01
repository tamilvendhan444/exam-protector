import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'db_fallback.json');
try {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const users = data.users || [];
  console.log('Total users:', users.length);
  if (users.length > 0) {
    console.log('First user name:', users[0].name);
    console.log('Keys of first user:', Object.keys(users[0]));
    console.log('Last user name:', users[users.length-1].name);
  }
} catch (e) {
  console.log('Error reading fallback db:', e.message);
}
