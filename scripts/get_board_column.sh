const https = require('https');

if (!process.env.MONDAY_API_KEY) {
  console.error('❌ MONDAY_API_KEY not found in environment');
  process.exit(1);
}

// Get board ID from command line argument
const boardId = process.argv[2];

if (!boardId) {
  console.error('❌ Please provide a board ID');
  console.log('Usage: node get-board-columns.js <BOARD_ID>');
  console.log('Example: node get-board-columns.js 1234567890');
  process.exit(1);
}

const query = `
  query {
    boards(ids: [${boardId}]) {
      id
      name
      description
      columns {
        id
        title
        type
        settings_str
      }
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

console.log(`🔍 Fetching columns for board ID: ${boardId}`);
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

      if (!response.data.boards || response.data.boards.length === 0) {
        console.error('❌ Board not found or no access');
        return;
      }

      const board = response.data.boards[0];
      
      console.log(`📋 Board: "${board.name}" (ID: ${board.id})`);
      if (board.description) {
        console.log(`📝 Description: ${board.description}`);
      }
      console.log('');
      console.log('📊 Available Columns:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      board.columns.forEach((column, index) => {
        const typeEmoji = getTypeEmoji(column.type);
        console.log(`${index + 1}. ${typeEmoji} "${column.title}"`);
        console.log(`   📁 ID: ${column.id}`);
        console.log(`   🏷️  Type: ${column.type}`);
        if (column.settings_str) {
          console.log(`   ⚙️  Settings: ${column.settings_str}`);
        }
        console.log('');
      });

      console.log('💡 To use a column for batch codes:');
      console.log('   1. Choose a "text" type column');
      console.log('   2. Set environment variable: MONDAY_COLUMN_ID=<column_id>');
      console.log('   3. Set board ID: MONDAY_BOARD_ID=' + board.id);
      
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

function getTypeEmoji(type) {
  const typeMap = {
    'text': '📝',
    'long-text': '📄',
    'status': '🏷️',
    'date': '📅',
    'checkbox': '☑️',
    'person': '👤',
    'numbers': '🔢',
    'rating': '⭐',
    'timeline': '📊',
    'file': '📎',
    'link': '🔗',
    'email': '📧',
    'phone': '📞',
    'dropdown': '📋',
    'mirror': '🪞',
    'dependency': '🔄'
  };
  return typeMap[type] || '❓';
}
