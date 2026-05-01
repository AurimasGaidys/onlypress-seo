import { useState, useEffect } from 'react';

/**
 * Custom hook to simulate a typing effect for a single string.
 * @param text The full text to type out.
 * @param speed The typing speed in milliseconds per character.
 * @returns The portion of the text that should be displayed at the current time.
 */
export function useTypingEffect(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // Pradedame nuo tuščio teksto kiekvieną kartą, kai pasikeičia text prop'sas
    setDisplayedText('');

    if (!text) return;

    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, speed);

    // Valymo funkcija, kuri sustabdo intervalą, jei komponentas sunaikinamas
    return () => {
      clearInterval(typingInterval);
    };
  }, [text, speed]); // Hook'as persikraus, jei pasikeis tekstas arba greitis

  return displayedText;
}
