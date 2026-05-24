import { ConversationStatus } from '@motor100/shared';

export function App() {
  return (
    <div>
      <h1>Motor100 — Agent Workspace</h1>
      <p>Status disponíveis: {Object.values(ConversationStatus).join(', ')}</p>
    </div>
  );
}
