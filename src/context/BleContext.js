import React, { createContext, useState, useContext } from "react";

const BLEContext = createContext();

export const BLEProvider = ({ children }) => {
  const [bleState, setBleState] = useState(null);
  const [devices, setDevices] = useState([]);
  const [started, setStarted] = useState(false);

  return (
    <BLEContext.Provider
      value={{
        bleState,
        setBleState,
        devices,
        setDevices,
        started,
        setStarted,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};

export const useBLE = () => useContext(BLEContext);
