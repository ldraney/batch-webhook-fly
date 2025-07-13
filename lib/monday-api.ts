// Utility function to wait/delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function updateMondayColumn(
  boardId: number,
  itemId: number,
  columnId: string,
  value: string,
  maxRetries: number = 3
): Promise<any> {
  
  // Use GraphQL variables with the correct types and format
  const mutation = `
    mutation($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(
        board_id: $boardId
        item_id: $itemId
        column_id: $columnId
        value: $value
      ) {
        id
      }
    }
  `
  
  const variables = {
    boardId: boardId.toString(),
    itemId: itemId.toString(),
    columnId: columnId,
    value: JSON.stringify(value)  // KEY: text columns need JSON.stringify()!
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wait a bit before attempting (especially important for first attempt)
      if (attempt === 1) {
        console.log(`⏱️  Waiting 2 seconds for task to be fully created...`)
        await delay(2000) // 2 second delay for new tasks
      } else {
        console.log(`⏱️  Retry ${attempt}/${maxRetries} - waiting 1 second...`)
        await delay(1000) // 1 second delay for retries
      }
      
      console.log(`🔄 Attempt ${attempt}/${maxRetries} to update column ${columnId} with value: ${value}`)
      console.log(`📋 Variables:`, JSON.stringify(variables, null, 2))
      
      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.MONDAY_API_KEY!,
        },
        body: JSON.stringify({ 
          query: mutation,
          variables: variables
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Monday.com API HTTP error: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.errors) {
        const errorMessage = result.errors.map((e: any) => e.message).join(', ')
        throw new Error(`Monday.com GraphQL error: ${errorMessage}`)
      }
      
      console.log(`✅ Successfully updated column on attempt ${attempt}`)
      return result.data
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error)
      
      if (attempt === maxRetries) {
        // Final attempt failed
        throw new Error(`Failed to update Monday.com column after ${maxRetries} attempts: ${error}`)
      }
      
      // Continue to next attempt
      console.log(`🔄 Retrying in a moment...`)
    }
  }
}
