#!/usr/bin/env node

/**
 * 🦐 Pinch Game Loop
 * 
 * Orchestrates one turn: reads world → collects agent actions → updates world.
 * 
 * Usage:
 *   node game-loop.js                    # Show current state
 *   node game-loop.js --turn             # Execute one turn (reads actions from stdin)
 *   node game-loop.js --event "食堂只有三份饭"  # Inject an event
 */

const { loadWorld, saveWorld, addEvent, addHistory, advanceTurn, buildAgentPrompt } = require('./world');

function parseAgentResponse(response) {
  // Try to extract JSON from the response
  try {
    // Handle markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    // Try to find JSON object in the string
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
  } catch (e) {
    // If parsing fails, return a default action
  }
  
  // Fallback: treat the whole response as a speech action
  return {
    action: "站着不动",
    speech: response.slice(0, 200),
    move_to: "",
    new_mood: "",
    new_status: ""
  };
}

function applyAction(world, agentId, parsed) {
  const agent = world.agents.find(a => a.id === agentId);
  if (!agent) return;
  
  // Move if specified
  if (parsed.move_to) {
    agent.position = parsed.move_to;
  }
  
  // Update mood if specified
  if (parsed.new_mood) {
    agent.mood = parsed.new_mood;
  }
  
  // Update status if specified
  if (parsed.new_status) {
    agent.status = parsed.new_status;
  }
  
  // Record in history
  const entry = {
    speaker: agent.name,
    action: parsed.action || "",
    speech: parsed.speech || ""
  };
  
  addHistory(world, entry);
}

function executeTurn(world, agentResponses) {
  // agentResponses is an array of { agentId, response } objects
  for (const { agentId, response } of agentResponses) {
    const parsed = parseAgentResponse(response);
    applyAction(world, agentId, parsed);
  }
  
  advanceTurn(world);
  saveWorld(world);
  return world;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--event')) {
    const eventIdx = args.indexOf('--event');
    const eventText = args[eventIdx + 1];
    if (!eventText) {
      console.error('Please provide event text');
      process.exit(1);
    }
    const world = loadWorld();
    addEvent(world, eventText);
    saveWorld(world);
    console.log(`⚡ Event added: "${eventText}"`);
  } else if (args.includes('--turn')) {
    // Read actions from stdin (JSON array)
    let input = '';
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      try {
        const actions = JSON.parse(input);
        const world = loadWorld();
        executeTurn(world, actions);
        console.log(`✅ Turn ${world.turn} executed`);
      } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
      }
    });
  } else {
    // Show current state
    const world = loadWorld();
    console.log(`🌍 Turn ${world.turn} — ${world.agents.length} agents`);
    world.agents.forEach(a => {
      console.log(`  🦐 ${a.name}: ${a.status} @ ${a.position}`);
    });
  }
}

module.exports = { executeTurn, parseAgentResponse, applyAction };
