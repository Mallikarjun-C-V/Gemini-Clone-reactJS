import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';
import WelcomeModal from './components/WelcomeModal/WelcomeModal';
import CursorTrail from './CursorTrail';

const App = () => {
  const [userName, setUserName] = useState(null);

  const [displayedName, setDisplayedName] = useState('ಅನಾಮಿಕ');

  const [animationClass, setAnimationClass] = useState('');

  const handleNameSubmit = (newName) => {
    setUserName(newName);

    setTimeout(() => {
      setAnimationClass('slide-out');

      setTimeout(() => {
        setDisplayedName(newName);
        setAnimationClass('slide-in');
      }, 500);

    }, 1000);
  };

  return (
    <>
      {!userName && <WelcomeModal onNameSubmit={handleNameSubmit} />}

      <Sidebar />
      <CursorTrail />

      <Main
        displayedName={displayedName}
        animationClass={animationClass}
      />
    </>
  );
};

export default App;