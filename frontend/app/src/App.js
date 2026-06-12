import { useEffect, useState } from 'react';
import DocExtract from './DocExtract';
import AIExtractorChat from './chatBot';
import Login from './login';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('loggedInUser');
      }
      return;
    }

    const savedId = localStorage.getItem('id');
    const savedEmail = localStorage.getItem('email');

    if (savedId && savedEmail) {
      const restoredUser = { id: savedId, email: savedEmail };
      localStorage.setItem('loggedInUser', JSON.stringify(restoredUser));
      setCurrentUser(restoredUser);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    [
      'id',
      'role',
      'email',
      'name',
      'entity_type',
      'employee_id',
      'designation',
      'loggedInUser',
    ].forEach((key) => localStorage.removeItem(key));
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
    <DocExtract onLogout={handleLogout} />
    <AIExtractorChat />
    </>
  )
  
}

export default App;
