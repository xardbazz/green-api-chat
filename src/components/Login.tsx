import { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  onLogin: (idInstance: string, apiTokenInstance: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      setError('Пожалуйста, заполните оба поля.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(
        `https://api.green-api.com/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`
      );

      if (res.data.stateInstance === 'authorized') {
        onLogin(idInstance, apiTokenInstance);
      } else {
        setError('Экземпляр не авторизован. Instance is not authorized. CУбедитесь, что вы отсканировали QR-код.');
      }
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data : undefined;
      setError(detail?.description || 'Invalid credentials or connection error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Войти в Green-API</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="login-initials">
          <label>ID:</label>
          <input
            type="text"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="Enter your ID Instance"
            disabled={loading}
          />
        </div>
        <div>
          <label>API-токен:</label>
          <input
            type={showToken ? 'text' : 'password'}
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Введите ваш API-токен"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <div className="password-toggler">
          <input
            type="checkbox"
            id="show-token"
            checked={showToken}
            onChange={(e) => setShowToken(e.target.checked)}
          />
          <label htmlFor="show-token">Показать токен</label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Проверяем...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

export default Login;