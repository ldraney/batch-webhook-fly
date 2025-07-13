import { NextRequest, NextResponse } from 'next/server'
import { generateBatchCode } from '@/lib/code-generator'
import { updateMondayColumn } from '@/lib/monday-api'

export async function GET() {
  return NextResponse.json({ 
    status: 'ready',
    service: 'monday-batch-webhook',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    configured: !!(
      process.env.MONDAY_API_KEY && 
      process.env.MONDAY_BOARD_ID && 
      process.env.MONDAY_COLUMN_ID
    ),
    message: 'Monday.com batch webhook endpoint is operational'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 Webhook received:', JSON.stringify(body, null, 2))
    
    // Handle Monday.com challenge verification
    if (body.challenge) {
      console.log('✅ Challenge verification:', body.challenge)
      return NextResponse.json({ challenge: body.challenge })
    }
    
    // Check configuration
    if (!process.env.MONDAY_API_KEY) {
      console.error('❌ MONDAY_API_KEY not configured')
      return new NextResponse('Missing API key', { status: 500 })
    }
    
    if (!process.env.MONDAY_BOARD_ID || !process.env.MONDAY_COLUMN_ID) {
      console.error('❌ MONDAY_BOARD_ID or MONDAY_COLUMN_ID not configured')
      return new NextResponse('Missing board/column configuration', { status: 500 })
    }
    
    // Process webhook event
    const event = body.event
    
    if (event?.type === 'create_pulse') {
      console.log(`📝 Task created: "${event.pulseName}" (ID: ${event.pulseId})`)
      console.log(`📋 Board ID: ${event.boardId}`)
      console.log(`🏢 Expected Board: ${process.env.MONDAY_BOARD_ID}`)
      
      // Check if this is the board we're configured for
      if (event.boardId.toString() !== process.env.MONDAY_BOARD_ID) {
        console.log(`⚠️  Ignoring task from different board (${event.boardId} ≠ ${process.env.MONDAY_BOARD_ID})`)
        return NextResponse.json({ 
          status: 'ignored',
          message: 'Task not from configured board'
        })
      }
      
      // Generate 6-digit alphanumeric batch code
      const batchCode = generateBatchCode()
      console.log(`🏷️  Generated batch code: ${batchCode}`)
      
      // Update Monday.com column with the batch code
      try {
        console.log(`🔄 Updating Monday.com...`)
        console.log(`   📋 Board: ${event.boardId}`)
        console.log(`   📝 Task: ${event.pulseId} ("${event.pulseName}")`)
        console.log(`   📊 Column: ${process.env.MONDAY_COLUMN_ID}`)
        console.log(`   🏷️  Value: ${batchCode}`)
        
        await updateMondayColumn(
          event.boardId,
          event.pulseId,
          process.env.MONDAY_COLUMN_ID,
          batchCode
        )
        console.log(`✅ Successfully updated Monday.com column with batch code: ${batchCode}`)
      } catch (apiError) {
        console.error('❌ Failed to update Monday.com after all retries:', apiError)
        return new NextResponse('Failed to update Monday.com', { status: 500 })
      }
    } else {
      console.log(`ℹ️  Ignoring event type: ${event?.type}`)
    }
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Webhook processed successfully'
    })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new NextResponse('Invalid JSON', { status: 400 })
  }
}
