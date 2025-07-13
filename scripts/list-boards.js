const https = require('https');

if (!process.env.MONDAY_API_KEY) {
  console.error('❌ MONDAY_API_KEY not found in environment');
  console.log('💡 Set it: export MONDAY_API_KEY="your_key"');
  process.exit(1);
}

const query = `
  query {
    boards(limit: 25) {
      id
      name
      description
      state
      board_folder_id
      items_count
    }
  }
`;

const postData = JSON.stringify({ query });

const options = {
  hostname: 'api.monday.com',
  port: 443,
  path: '/v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': process.env.MONDAY_API_KEY,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔍 Fetching your Monday.com boards...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.errors) {
        console.error('❌ GraphQL errors:', response.errors);
        return;
      }

      if (!response.data.boards) {
        console.error('❌ No boards found');
        return;
      }

      const boards = response.data.boards;
      
      console.log(`📋 Found ${boards.length} board(s):`);
      console.log('');
      
      boards.forEach((board, index) => {
        const stateEmoji = board.state === 'active' ? '✅' : '❌';
        console.log(`${index + 1}. ${stateEmoji} "${board.name}"`);
        console.log(`   📁 ID: ${board.id}`);
        console.log(`   📊 Items: ${board.items_count}`);
        console.log(`   📝 State: ${board.state}`);
        if (board.description) {
          console.log(`   📄 Description: ${board.description}`);
        }
        console.log('');
      });

      console.log('💡 Next step:');
      console.log('   Run: node get-board-columns.js <BOARD_ID>');
      console.log('   Example: node get-board-columns.js ' + boards[0].id);
      
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();
