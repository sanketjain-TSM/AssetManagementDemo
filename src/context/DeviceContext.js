import React, { createContext, useContext } from "react";
import useDevices from "../utils/useDevices";

const DevicesContext = createContext();

export const DevicesProvider = ({ children }) => {
  const devicesHook = useDevices();

  return (
    <DevicesContext.Provider value={devicesHook}>
      {children}
    </DevicesContext.Provider>
  );
};

export const useDevicesContext = () => {
  return useContext(DevicesContext);
};
