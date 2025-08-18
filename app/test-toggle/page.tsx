"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function TestTogglePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("test123");

  const handleToggle = () => {
    console.log("Toggle clicked! Current state:", showPassword);
    setShowPassword(!showPassword);
  };

  return (
    <div className="p-8 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Password Toggle Test</h1>
      
      {/* Debug info */}
      <div className="bg-blue-100 p-4 rounded">
        <p><strong>State:</strong> {showPassword ? "VISIBLE" : "HIDDEN"}</p>
        <p><strong>Input type:</strong> {showPassword ? "text" : "password"}</p>
        <p><strong>Password:</strong> {password}</p>
      </div>

      {/* Test button first */}
      <button 
        onClick={handleToggle}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Toggle Password (Currently: {showPassword ? "Visible" : "Hidden"})
      </button>

      {/* Simple input with toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Simple Password Input
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md pr-12"
            placeholder="Enter password"
          />
          <div
            onClick={handleToggle}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 bg-red-200 p-1 rounded"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>
      </div>

      {/* Complex input like in auth forms */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Complex Password Input (Like Auth Forms)
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-4 pr-12"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Complex toggle clicked!");
              handleToggle();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-20 bg-yellow-200 p-1 rounded cursor-pointer"
            style={{ minWidth: '28px', minHeight: '28px' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Click test area */}
      <div 
        onClick={() => alert("Div clicked!")}
        className="bg-green-100 p-4 rounded cursor-pointer"
      >
        Click this div to test if clicks work at all
      </div>
    </div>
  );
}
