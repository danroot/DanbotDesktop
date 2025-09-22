import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

class AIAgentService {
  constructor() {
    this.openai = null;
    this.agents = new Map();
    this.isInitialized = false;
    this.transcriptBuffer = [];
    this.currentRoles = '';
    this.currentStories = '';
  }

  async initialize(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey
    });

    // Load agent configurations
    await this.loadAgentConfigurations();
    this.isInitialized = true;
  }

  async loadAgentConfigurations() {
    try {
      const promptsDir = path.join(process.cwd(), 'prompts');
      const files = await fs.readdir(promptsDir);
      
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(promptsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const config = YAML.parse(content);
          this.agents.set(config.name, config);
        }
      }
    } catch (error) {
      console.error('Error loading agent configurations:', error);
    }
  }

  getAvailableAgents() {
    return Array.from(this.agents.values()).map(agent => ({
      name: agent.name,
      description: agent.description
    }));
  }

  async processTranscript(transcript, enabledAgents) {
    if (!this.isInitialized || !transcript) {
      return;
    }

    // Add to transcript buffer for context
    this.transcriptBuffer.push(transcript);
    
    // Keep only recent transcript segments (last 10 for context)
    if (this.transcriptBuffer.length > 10) {
      this.transcriptBuffer = this.transcriptBuffer.slice(-10);
    }

    const recentTranscript = this.transcriptBuffer.join('\n');

    for (const agentName of enabledAgents) {
      const agent = this.agents.get(agentName);
      if (!agent) continue;

      try {
        await this.processWithAgent(agent, recentTranscript);
      } catch (error) {
        console.error(`Error processing with agent ${agentName}:`, error);
      }
    }
  }

  async processWithAgent(agent, transcript) {
    // Prepare context based on agent type
    let currentContent = '';
    if (agent.name === 'RealtimeBA-RoleListener') {
      currentContent = this.currentRoles;
    } else if (agent.name === 'RealtimeBA-UserStoryListener') {
      currentContent = this.currentStories;
    }

    const userPrompt = agent.user_prompt_template
      .replace('{transcript}', transcript)
      .replace('{current_roles}', currentContent)
      .replace('{current_stories}', currentContent);

    const response = await this.openai.chat.completions.create({
      model: agent.parameters.model || 'gpt-4',
      messages: [
        { role: 'system', content: agent.system_prompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: agent.parameters.temperature || 0.3,
      max_tokens: agent.parameters.max_tokens || 1000
    });

    const generatedContent = response.choices[0]?.message?.content;
    if (generatedContent) {
      await this.saveAgentOutput(agent, generatedContent);
    }
  }

  async saveAgentOutput(agent, content) {
    try {
      const outputPath = path.join(process.cwd(), agent.output_file);
      await fs.writeFile(outputPath, content, 'utf8');
      
      // Update internal cache
      if (agent.name === 'RealtimeBA-RoleListener') {
        this.currentRoles = content;
      } else if (agent.name === 'RealtimeBA-UserStoryListener') {
        this.currentStories = content;
      }

      console.log(`Updated ${agent.output_file} with AI-generated content`);
    } catch (error) {
      console.error(`Error saving output for ${agent.name}:`, error);
    }
  }

  async loadExistingContent() {
    // Load existing Roles.md and UserStories.md files if they exist
    try {
      const rolesPath = path.join(process.cwd(), 'Roles.md');
      this.currentRoles = await fs.readFile(rolesPath, 'utf8');
    } catch (error) {
      this.currentRoles = '# Meeting Roles\n\nNo roles identified yet.\n';
    }

    try {
      const storiesPath = path.join(process.cwd(), 'UserStories.md');
      this.currentStories = await fs.readFile(storiesPath, 'utf8');
    } catch (error) {
      this.currentStories = '# User Stories\n\nNo user stories identified yet.\n';
    }
  }

  reset() {
    this.transcriptBuffer = [];
    this.currentRoles = '';
    this.currentStories = '';
  }
}

export default new AIAgentService();