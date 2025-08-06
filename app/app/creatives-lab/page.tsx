"use client";

import React, { useState, useRef, useCallback } from 'react';
import { 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw,
  Move,
  MousePointer
} from 'lucide-react';

interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  src?: string;
}

const CreativesLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'image'>('select');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const tools = [
    { id: 'select', name: 'Select', icon: MousePointer },
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'image', name: 'Image', icon: ImageIcon },
  ];

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    elements.forEach((element) => {
      ctx.fillStyle = element.fill;
      ctx.strokeStyle = element.stroke;
      ctx.lineWidth = element.strokeWidth;

      switch (element.type) {
        case 'rectangle':
          ctx.fillRect(element.x, element.y, element.width, element.height);
          ctx.strokeRect(element.x, element.y, element.width, element.height);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(
            element.x + element.width / 2,
            element.y + element.height / 2,
            Math.min(element.width, element.height) / 2,
            0,
            2 * Math.PI
          );
          ctx.fill();
          ctx.stroke();
          break;
        case 'text':
          ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
          ctx.fillText(element.text || 'Text', element.x, element.y);
          break;
        case 'image':
          // For demo purposes, we'll draw a placeholder
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(element.x, element.y, element.width, element.height);
          ctx.strokeRect(element.x, element.y, element.width, element.height);
          ctx.fillStyle = '#666';
          ctx.font = '14px Arial';
          ctx.fillText('Image', element.x + 10, element.y + 20);
          break;
      }

      // Draw selection border
      if (element.id === selectedElement) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        ctx.setLineDash([]);
      }
    });
  }, [elements, selectedElement]);

  React.useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'select') {
      // Find clicked element
      const clickedElement = elements.find(el => 
        x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
      );
      setSelectedElement(clickedElement?.id || null);
    } else {
      setIsDrawing(true);
      setStartPos({ x, y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool === 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update preview (could implement live preview here)
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool === 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = Math.abs(x - startPos.x);
    const height = Math.abs(y - startPos.y);
    const finalX = Math.min(x, startPos.x);
    const finalY = Math.min(y, startPos.y);

    if (width > 5 && height > 5) { // Minimum size
      const newElement: CanvasElement = {
        id: `element-${Date.now()}`,
        type: selectedTool as 'rectangle' | 'circle' | 'text' | 'image',
        x: finalX,
        y: finalY,
        width,
        height,
        fill: '#F8B259',
        stroke: '#D96F32',
        strokeWidth: 2,
        text: selectedTool === 'text' ? 'New Text' : undefined,
        fontSize: 16,
        fontFamily: 'Arial',
      };

      setElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);
    }

    setIsDrawing(false);
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    setSelectedElement(null);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'creative-design.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const selectedElementData = selectedElement 
    ? elements.find(el => el.id === selectedElement)
    : null;

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElement) return;
    
    setElements(prev => prev.map(el => 
      el.id === selectedElement ? { ...el, ...updates } : el
    ));
  };

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Creatives Lab</h1>
            <p className="text-sm text-gray-600">Create and edit visual content for your campaigns</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearCanvas}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </button>
            <button
              onClick={downloadCanvas}
              className="btn-primary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Toolbar */}
        <div className="w-16 border-r border-gray-200 bg-gray-50 p-2">
          <div className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id as any)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title={tool.name}
              >
                <tool.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-100">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-300 cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Properties</h3>
          
          {selectedElementData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fill Color
                </label>
                <input
                  type="color"
                  value={selectedElementData.fill}
                  onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stroke Color
                </label>
                <input
                  type="color"
                  value={selectedElementData.stroke}
                  onChange={(e) => updateSelectedElement({ stroke: e.target.value })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stroke Width
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={selectedElementData.strokeWidth}
                  onChange={(e) => updateSelectedElement({ strokeWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {selectedElementData.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text
                    </label>
                    <input
                      type="text"
                      value={selectedElementData.text || ''}
                      onChange={(e) => updateSelectedElement({ text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={selectedElementData.fontSize || 16}
                      onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}

              <button
                onClick={deleteSelectedElement}
                className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Element
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Palette className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Select an element to edit its properties</p>
              <p className="text-sm mt-1">Or choose a tool to start creating</p>
            </div>
          )}

          {/* Quick Templates */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 border border-gray-200 rounded hover:bg-gray-50 text-xs">
                Ad Banner
              </button>
              <button className="p-3 border border-gray-200 rounded hover:bg-gray-50 text-xs">
                Social Post
              </button>
              <button className="p-3 border border-gray-200 rounded hover:bg-gray-50 text-xs">
                Logo Design
              </button>
              <button className="p-3 border border-gray-200 rounded hover:bg-gray-50 text-xs">
                Product Card
              </button>
            </div>
          </div>

          {/* AI Tools */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">AI Tools</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                🎨 Generate Background
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                ✨ Enhance Quality
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                🔤 Generate Copy
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                🎯 A/B Test Variants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativesLab;