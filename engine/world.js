#!/usr/bin/env node

/**
 * 🦐 Pinch World Engine
 * 
 * Manages the world state: read, update, inject events.
 */

const fs = require('fs');
const path = require('path');

const WORLD_PATH = path.join(__dirname, '..', 'data', 'world.json');

function loadWorld() {
  return JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
}

function saveWorld(world) {
  fs.writeFileSync(WORLD_PATH, JSON.stringify(world, null, 2) + '\n');
}

function addEvent(world, event) {
  world.events.push({
    text: event,
    turn: world.turn,
    timestamp: new Date().toISOString()
  });
}

function addHistory(world, entry) {
  world.history.push({
    ...entry,
    turn: world.turn,
    timestamp: new Date().toISOString()
  });
}

function advanceTurn(world) {
  world.turn += 1;
  // Clear events after they've been processed
  world.events = [];
}

function getAgent(world, agentId) {
  return world.agents.find(a => a.id === agentId);
}

function updateAgent(world, agentId, updates) {
  const agent = getAgent(world, agentId);
  if (agent) {
    Object.assign(agent, updates);
  }
}

function buildAgentPrompt(world, agentId) {
  const agent = getAgent(world, agentId);
  if (!agent) return null;
  
  const others = world.agents
    .filter(a => a.id !== agentId)
    .map(a => `${a.name}(${a.personality}) 在 ${a.position}，${a.status}`)
    .join('\n');
  
  const activeEvents = world.events.map(e => e.text).join('\n');
  const recentHistory = world.history
    .filter(h => h.turn >= world.turn - 3)
    .map(h => `[Turn ${h.turn}] ${h.speaker || ''} ${h.action || ''} ${h.text || ''}`)
    .join('\n');
  
  return `你是${agent.name}，一只虾。

性格：${agent.personality}
当前心情：${agent.mood}
位置：${agent.position}
状态：${agent.status}
随身物品：${agent.inventory.length > 0 ? agent.inventory.join(', ') : '无'}

教室里还有：
${others}

${activeEvents ? '当前事件：\n' + activeEvents : ''}
${recentHistory ? '最近发生：\n' + recentHistory : ''}

现在轮到你行动了。你可以：
- 观察周围环境
- 说话（和其他虾交流）
- 移动到其他位置
- 做某件事（画画、看书、发呆等）

请用 JSON 格式回复你的行动：
{
  "action": "你做了什么（简短描述）",
  "speech": "你说的话（可选，不想说话就留空）",
  "move_to": "你想去的位置（不想移动就留空）",
  "new_mood": "你的心情变化（可选）",
  "new_status": "你的新状态（可选）"
}`;
}

// Export for use by game-loop and web server
module.exports = { loadWorld, saveWorld, addEvent, addHistory, advanceTurn, getAgent, updateAgent, buildAgentPrompt };

// CLI: show current world
if (require.main === module) {
  const world = loadWorld();
  console.log(`🌍 ${world.name} — Turn ${world.turn}`);
  console.log(`📍 Room: ${world.room}`);
  console.log(`📝 ${world.description}`);
  console.log(`\n🦐 Agents:`);
  for (const a of world.agents) {
    console.log(`  ${a.name} (${a.personality}) — ${a.mood} — ${a.status} @ ${a.position}`);
  }
  if (world.events.length > 0) {
    console.log(`\n⚡ Events:`);
    world.events.forEach(e => console.log(`  - ${e.text}`));
  }
  if (world.history.length > 0) {
    console.log(`\n📜 History (last 5):`);
    world.history.slice(-5).forEach(h => {
      console.log(`  [Turn ${h.turn}] ${h.speaker || ''} ${h.action || ''} ${h.text || ''}`);
    });
  }
}
