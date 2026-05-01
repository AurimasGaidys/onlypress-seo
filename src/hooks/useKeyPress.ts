// src/hooks/useKeyPress.ts
import { useEffect, useState } from 'react';

export function useKeyPress(targetKey: string, metaKey = false, ctrlKey = false) {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey && (metaKey ? event.metaKey : true) && (ctrlKey ? event.ctrlKey : true)) {
        event.preventDefault(); // Svarbu, kad neatidarytų naršyklės spausdinimo lango (Cmd+P) ir pan.
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey, metaKey, ctrlKey]);

  return keyPressed;
}
