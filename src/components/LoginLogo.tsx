import React from "react";

const LoginLogo = ({ className = "" }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <img
      src="/logo.svg"
      alt="EV Power Energy"
      className="w-24 h-24 mb-2 object-contain drop-shadow-xl"
    />
    {/* <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2 tracking-tight text-center drop-shadow-sm leading-relaxed pb-1 min-h-[2.8rem]">
      EV Power Energy
    </h1> */}
  </div>
);

export default LoginLogo; 