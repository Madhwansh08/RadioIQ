import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, vi, expect, beforeEach } from "vitest";
import axios from "axios";
import Quadrant from "../screens/Quadrant";
import "@testing-library/jest-dom/vitest"
 
// Mock the logo image properly
vi.mock("../assets/logo.png", () => ({ default: "mock-logo.png" }));
 
// Mock framer-motion to prevent animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
}));
 
// Mock Axios for API calls
vi.mock("axios");
 
// Mock the Progress component
vi.mock("../components/Progress", () => ({
  __esModule: true,
  default: () => <div>Mock Progress Component</div>,
}));
 
// Mock the FaArrowLeft and FaArrowRight icons
vi.mock("react-icons/fa", () => ({
  FaArrowLeft: () => <svg data-testid="FaArrowLeft" />,
  FaArrowRight: () => <svg data-testid="FaArrowRight" />,
}));
 
describe("Quadrant Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
 
  it("renders the quadrant page with logo and progress component", async () => {
    // Mock API Responses
    axios.get
      .mockResolvedValueOnce({ data: { patientId: "12345", age: 30, gender: "Male" } }) // Mock patient data
      .mockResolvedValueOnce({ data: { url: "mock-xray-url", note: "Normal X-ray" } }); // Mock X-ray data
 
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    // Check for logo
    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
 
    // Check for Progress component
    expect(screen.getByText(/Mock Progress Component/i)).toBeInTheDocument();
  });
 
  it("renders X-ray images and handles zoom and pan", async () => {
    // Mock API Responses
    axios.get
      .mockResolvedValueOnce({ data: { patientId: "12345", age: 30, gender: "Male" } }) // Mock patient data
      .mockResolvedValueOnce({ data: { url: "mock-xray-url", note: "Normal X-ray" } }); // Mock X-ray data
 
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    // Check for X-ray images
    await waitFor(() => {
      expect(screen.getAllByAltText(/xray quadrant/i).length).toBeGreaterThan(0);
    });
 
    // Initially, the cursor should be zoom-in
    const container = screen.getByRole("img", { name: /xray quadrant 1/i }).closest("div");
    await waitFor(() => {
      expect(container).toHaveStyle({ cursor: "zoom-in" });
    });
 
    // Simulate zoom to change cursor to grab
    fireEvent.wheel(container, { deltaY: -100 });
    await waitFor(() => {
      expect(container).toHaveStyle({ cursor: "grab" });
    });
 
    // Simulate pan
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(container);
    
    // Ensure the cursor is still grab after panning
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(container).toHaveStyle({ cursor: "grab" });
    });
 
    // Simulate zoom out to change cursor back to zoom-in
    fireEvent.wheel(container, { deltaY: 100 });
    await waitFor(() => {
      expect(container).toHaveStyle({ cursor: "zoom-in" });
    });
  });
 
  it("handles next and previous slide buttons", async () => {
    // Mock API Responses
    axios.get
      .mockResolvedValueOnce({ data: { patientId: "12345", age: 30, gender: "Male" } }) // Mock patient data
      .mockResolvedValueOnce({ data: { url: "mock-xray-url", note: "Normal X-ray" } }); // Mock X-ray data
 
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    // Check for next slide button
    const nextButton = screen.getByTestId("FaArrowRight").closest("button");
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getAllByAltText(/xray quadrant/i).length).toBeGreaterThan(0);
    });
 
    // Check for previous slide button
    const prevButton = screen.getByTestId("FaArrowLeft").closest("button");
    expect(prevButton).toBeInTheDocument();
    fireEvent.click(prevButton);
    await waitFor(() => {
      expect(screen.getAllByAltText(/xray quadrant/i).length).toBeGreaterThan(0);
    });
  });
 
  // Additional test cases
 
  it("handles API errors gracefully", async () => {
    // Mock API Responses with error
    axios.get.mockRejectedValueOnce(new Error("API Error"));
 
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    // The component should handle the error gracefully, possibly logging it
    expect(screen.queryByAltText(/logo/i)).toBeInTheDocument(); // Ensure the logo is still rendered
  });
 
  it("does not pan when zoom level is 1", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    // Initially, the cursor should be zoom-in
    const container = screen.getByRole("img", { name: /xray quadrant 1/i }).closest("div");
    await waitFor(() => {
      expect(container).toHaveStyle({ cursor: "zoom-in" });
    });
 
    // Simulate pan attempt when zoom level is 1
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(container);
    console.log("testing1" ,container.querySelector("img").style);
 
    // Ensure the cursor remains zoom-in and no offset changes
    await waitFor(() => {
      expect(container).toHaveStyle({ cursor: "zoom-in" });
      expect(container.querySelector("img")).toHaveStyle({
        top: "calc(50% + 0px)",
        left: "calc(50% + 0px)",
      });
    });
  });
 
  it("does not zoom beyond limits", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    const container = screen.getByRole("img", { name: /xray quadrant 1/i }).closest("div");
 
    // Simulate excessive zoom in
    for (let i = 0; i < 20; i++) {
      fireEvent.wheel(container, { deltaY: -100 });
    }
    await waitFor(() => {
      expect(container.querySelector("img")).toHaveStyle({
        width: "300%",
        height: "300%",
      });
    });
 
    // Simulate excessive zoom out
    for (let i = 0; i < 20; i++) {
      fireEvent.wheel(container, { deltaY: 100 });
    }
    await waitFor(() => {
      expect(container.querySelector("img")).toHaveStyle({
        width: "100%",
        height: "100%",
      });
    });
  });
 
  it("resets pan offset on zoom reset", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/12345/asdwdwd/quadrant"]}>
          <Routes>
            <Route path="/:patientSlug/:xraySlug/quadrant" element={<Quadrant />} />
          </Routes>
        </MemoryRouter>
      );
    });
 
    const container = screen.getByRole("img", { name: /xray quadrant 1/i }).closest("div");
 
    // Simulate zoom in and pan
    fireEvent.wheel(container, { deltaY: -100 });
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(container);
    await waitFor(() => {
      expect(container.querySelector("img")).toHaveStyle({
        top: "calc(50% + 100px)",
        left: "calc(50% + 100px)",
      });
    });
 
    // Simulate zoom reset
    fireEvent.wheel(container, { deltaY: 100 });
    console.log("testing2" ,container.querySelector("img").style);
    await waitFor(() => {
      expect(container.querySelector("img")).toHaveStyle({
        top: "calc(50% + 0px)",
        left: "calc(50% + 0px)",
      });
    });
  });
});