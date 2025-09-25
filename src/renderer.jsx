import React from "react";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Pause,
  Mic,
  Key,
  RefreshCw
} from 'lucide-react';
import "./styles.css";

const RecordingStatusIcon = ({ status }) => {
  const iconProps = {
    strokeWidth: 2,
    size: 24
  };

  switch (status) {
    case 'completed':
      return <CheckCircle2 {...iconProps} className="status-icon completed" />;
    case 'failed':
      return <AlertCircle {...iconProps} className="status-icon failed" />;
    case 'in-progress':
      return <UploadCloud {...iconProps} className="status-icon in-progress" />;
    case 'paused':
      return <Pause {...iconProps} className="status-icon paused" />;
    default:
      return null;
  }
};

const App = () => {
  const electronAPI = window.electronAPI.ipcRenderer;
  const [sdkState, setSdkState] = React.useState({
    bot_id: null,
    recording: false,
    transcript: null,
    video_url: null,
    permissions_granted: false,
    meetings: [],
    availableAgents: [],
    selectedAgents: [],
  });
  const [canTryStart, setCanTryStart] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [selectedAgents, setSelectedAgents] = React.useState([]);

  React.useEffect(() => {
    console.log("Setting up IPC listeners...");

    electronAPI.on("state", (newState) => {
      console.log("=== State received from SDK:", newState);
      setSdkState(newState);
    });

    // Signal that renderer is ready to receive state updates
    electronAPI.send("message-from-renderer", {
      command: "renderer-ready",
    });

    return () => {
      electronAPI.removeAllListeners("state");
    };
  }, []);

  const handleReupload = (id) => {
    electronAPI.send("message-from-renderer", {
      command: "reupload",
      id: id,
    });
  };

  const handleAgentToggle = (agentName) => {
    setSelectedAgents(prev => 
      prev.includes(agentName)
        ? prev.filter(name => name !== agentName)
        : [...prev, agentName]
    );
  };

  const handleStartRecording = () => {
    electronAPI.send("message-from-renderer", {
      command: "start-recording",
      selectedAgents: selectedAgents
    });

    setCanTryStart(false);

    setTimeout(function () {
      if (!sdkState.recording)
        setCanTryStart(true);
    }, 5000);
  };

  // console.log(sdkState);
  return (
    <div className="recorder-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <Mic strokeWidth={2} size={28} />
          <h2>Recordings</h2>
        </div>
        <div className="recordings-list">
          {sdkState.meetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`recording-item ${selectedMeeting?.id === meeting.id ? 'selected' : ''}`}
              onClick={() => setSelectedMeeting(meeting)}
            >
              <RecordingStatusIcon status={meeting.status} />
              <div className="recording-details">
                <span className="recording-title">{meeting.title}</span>
                <span className="recording-upload-progress">
                  {meeting.uploadPercentage}% Uploaded
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="main-content">
        <header className="app-header">
          <h1>Sample App Recorder</h1>
          <div className="recording-status">
            <span className={`status-indicator ${sdkState.recording ? 'recording' : 'idle'}`}>
              {sdkState.recording ? 'Recording' : 'Idle'}
            </span>
          </div>
        </header>

        <section className="control-panel">
          {
            sdkState.permissions_granted ?
              <div className="recording-controls">
                {!sdkState.recording && sdkState.availableAgents.length > 0 && (
                  <div className="ai-agents-section">
                    <h3>AI Agents</h3>
                    <p>Select AI agents to analyze the meeting transcript in real-time:</p>
                    <div className="agents-list">
                      {sdkState.availableAgents.map(agent => (
                        <label key={agent.name} className="agent-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedAgents.includes(agent.name)}
                            onChange={() => handleAgentToggle(agent.name)}
                            disabled={sdkState.recording}
                          />
                          <span className="agent-name">{agent.name}</span>
                          <span className="agent-description">{agent.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="recording-buttons">
                  <button
                    className="start-recording"
                    disabled={sdkState.recording || !canTryStart}
                    onClick={handleStartRecording}
                  >
                    <Mic strokeWidth={2} size={20} />
                    Start Recording
                    {selectedAgents.length > 0 && (
                      <span className="agents-count">with {selectedAgents.length} AI agent{selectedAgents.length !== 1 ? 's' : ''}</span>
                    )}
                  </button>
                  <button
                    className="stop-recording"
                    disabled={!sdkState.recording}
                    onClick={() => {
                      electronAPI.send("message-from-renderer", {
                        command: "stop-recording"
                      });
                    }}
                  >
                    <Pause strokeWidth={2} size={20} />
                    Stop Recording
                  </button>
                </div>

                {sdkState.recording && selectedAgents.length > 0 && (
                  <div className="active-agents">
                    <p>Active AI agents: {selectedAgents.join(', ')}</p>
                    <p>Check the project directory for generated Roles.md and UserStories.md files.</p>
                  </div>
                )}
              </div>
            :
            <div className="recording-controls">Permissions haven't been granted yet! Please do so in Settings.</div>
          }
          {selectedMeeting && (
            <div className="meeting-details">
              <h3>{selectedMeeting.title}</h3>
              <div className="meeting-actions">
                {(selectedMeeting.status !== 'in-progress') &&
                  <button
                    onClick={() => handleReupload(selectedMeeting.id)}
                    className="reupload-btn"
                  >
                    <RefreshCw strokeWidth={2} size={16} />
                    Reupload
                  </button>}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
