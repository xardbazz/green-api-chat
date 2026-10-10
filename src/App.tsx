import { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // To this (temporary fake credentials): REMOVE LATER
  /*const [credentials, setCredentials] = useState<Credentials | null>({
  idInstance: '1234567890',
  apiTokenInstance: 'fake-token-123'
  });*/

  const handleLogin = (idInstance: string, apiTokenInstance: string) => {
    setCredentials({ idInstance, apiTokenInstance });
  };
 
  return (
    <div className="app-wrapper">
      {!credentials ? (
        <div className="app-container">
          <Login onLogin={handleLogin} />
        </div>
      ) : (
        <Chat credentials={credentials} />
      )}
    </div>
  );
}

export default App;