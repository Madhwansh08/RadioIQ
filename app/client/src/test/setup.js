import "@testing-library/jest-dom";
import { vi } from "vitest";
 
// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
 
// Mock IntersectionObserver
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
 
// Mock HTMLCanvasElement's getContext method for Canvas API
global.HTMLCanvasElement.prototype.getContext = function () {
  return {
    fillStyle: "",
    fillRect: () => {},
    clearRect: () => {},
    drawImage: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => ({ data: [] }),
    setTransform: () => {},
    scale: () => {},
    rotate: () => {},
    translate: () => {},
    transform: () => {},
    drawText: () => {},
    measureText: () => ({ width: 0 }),
    getLineDash: () => [],
    setLineDash: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
  };
};
 
// ✅ Vitest Mock for Framer Motion
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: "div",
      span: "span",
      li: "li",
      ul: "ul",
      nav: "nav",
      img: "img",
    },
  };
});
 
global.EventSource = vi.fn(() => {
  console.warn("Mock EventSource is being used.");
  return {
    onmessage: null,
    onerror: null,
    close: vi.fn(),
  };
});
 
// Mock HTMLCanvasElement's toBlob method
global.HTMLCanvasElement.prototype.toBlob = function (callback) {
  callback(new Blob());
};