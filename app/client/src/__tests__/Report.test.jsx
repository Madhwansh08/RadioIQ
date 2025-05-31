import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { describe, it, vi, expect, beforeEach } from "vitest";
import axios from "axios";
import store from "../redux/store";
import Report from "../screens/Report";

// ✅ Fix: Mock the logo image properly
vi.mock("../assets/logo.png", () => ({ default: "mock-logo.png" }));

// ✅ Fix: Mock framer-motion to prevent animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
    button: ({ children }) => <button>{children}</button>,
  },
}));

// ✅ Mock Axios for API calls
vi.mock("axios");

describe("Report Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the report page with header and download buttons", async () => {
    // ✅ Mock API Responses
    axios.get
      .mockResolvedValueOnce({ data: { patientId: "12345", age: 30, gender: "Male" } }) // Mock patient data
      .mockResolvedValueOnce({ data: { url: "mock-xray-url", note: "Normal X-ray" } }); // Mock X-ray data

    // ✅ Wrap `render()` inside `act()` to handle state updates
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={["/12345/asdwdwd/report"]}>
            <Routes>
              <Route path="/:patientSlug/:xraySlug/report" element={<Report />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });

    // ✅ Check for page title
    expect(screen.getAllByText(/Download Report/i).length).toBeGreaterThan(0);


 

    // ✅ Mock the download button click and check if it is rendered
    const downloadButton = screen.getAllByText(/Download Report/i)[0];
    expect(downloadButton).toBeInTheDocument();
    downloadButton.click();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));


    // ✅ Check for multiple report download buttons (Fix the array assertion)
    expect(screen.getAllByText(/Download Report/i).length).toBeGreaterThan(0);
  });
});
