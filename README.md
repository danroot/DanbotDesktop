# Recall.ai Desktop SDK Electron Example (with Vite)

This is a minimal example application which can get you started quickly, and is ready to run `npm start` and `npm run make` on! This repo is intended to be used as a template for you to start off with. If you want a more feature-complete example application, take a look at [Muesli.](https://github.com/recallai/muesli-public)

![Screenshot 2025-06-16 at 10 05 41 PM](https://github.com/user-attachments/assets/36a6414b-f0bd-4397-b8ac-80127f0b0558)

## New Feature: AI Agents for Real-time Analysis

This application now supports AI agents that can analyze meeting transcripts in real-time and generate useful documentation. When starting a recording, you can select one or more AI agents to process the conversation.

### Available AI Agents

1. **RealtimeBA-RoleListener** - Analyzes meeting transcripts to identify and track participant roles, generating a `Roles.md` file
2. **RealtimeBA-UserStoryListener** - Extracts user stories and requirements from conversations, generating a `UserStories.md` file

### How AI Agents Work

- AI agents listen to real-time transcript events during recording
- Each agent processes the transcript using OpenAI's GPT-4 model
- Generated content is saved to markdown files in the project directory
- Agents maintain context across the entire meeting session

## Setup

Modify `.env` to include your API keys:

```
RECALLAI_API_URL=https://us-east-1.recall.ai
RECALLAI_API_KEY=<your recall.ai key>
OPENAI_API_KEY=<your openai api key>
```

**NOTE**: In a production application, you'd keep your API keys on your backend and perform the POST requests there, however for sake of simplicity, we do it here in the application.

```sh
npm install
npm start
```

## Using AI Agents

1. Start the application and ensure permissions are granted
2. When a meeting is detected or you want to start recording, you'll see AI agent options
3. Check the boxes for the agents you want to activate
4. Click "Start Recording" - the button will show how many agents are active
5. During recording, agents will process transcript segments and update their respective markdown files
6. Check the project directory for generated `Roles.md` and `UserStories.md` files

## Customizing AI Agents

AI agent configurations are stored in YAML files in the `prompts/` directory. You can:

- Modify existing agent prompts and parameters
- Create new agent configurations following the same YAML structure
- Adjust OpenAI model parameters (temperature, max_tokens, etc.)

Each agent YAML file contains:
- System prompt defining the agent's role and guidelines
- User prompt template for processing transcript segments
- Output file configuration
- Model parameters

## Technical Architecture

- **Main Process** (`src/main.js`) - Handles recording and AI agent orchestration
- **AI Agent Service** (`src/aiAgents.js`) - Manages OpenAI integration and file operations
- **Renderer Process** (`src/renderer.jsx`) - Provides UI for agent selection
- **Prompt Configurations** (`prompts/*.yaml`) - Defines agent behavior and prompts