import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import store from "../redux/store";
import AnalysisEdit from "../screens/AnalysisEdit";
import config from "../utils/config";
import userEvent from "@testing-library/user-event";
import axios from "axios";
 
// Mock assets (gif) to prevent loading issues
vi.mock("../../assets/PA.gif", () => "mock-pa.gif");
vi.mock("../../assets/RV_oval.gif", () => "mock-oval.gif");
vi.mock("../../assets/RV_sq.gif", () => "mock-sq.gif");
vi.mock("../../assets/RV_free.gif", () => "mock-free.gif");
 
// Mock Axios for API calls
vi.mock("axios");

vi.mock("../components/LabelModal.jsx", () => ({
  default: () => <span>MockLabelModal</span>
}));
 
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(toast, "success").mockImplementation(() => {}); // Ensure it doesn't break tests
  vi.spyOn(toast, "error").mockImplementation(() => {}); // Ensure it doesn't break tests
  globalThis.console = {
    ...console,
    error: vi.fn(),
    log: vi.fn(),
  };
  globalThis.fetch = vi.fn();
});
 
afterEach(() => {
  vi.restoreAllMocks();
});
 
describe("AnalysisEdit Components", () => {
  const xraySlug = "mock-xraySlug";
  it("renders the component correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
 
    // Check for canvas
    expect(screen.getByText(/Brightness/i)).toBeInTheDocument();
    expect(screen.getByText(/Contrast/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Negative/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Box Annotation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Oval Annotation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Point Annotation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Free Hand Annotation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save Annotation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Back to Analysis/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("drawing-canvas")).toBeInTheDocument();
  });
 
  it("fetches X-ray data successfully", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      json: async () => ({ url: "mock-xray-url" }),
    });
 
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/analysis-edit/${xraySlug}`]}>
          <Routes>
            <Route path="/analysis-edit/:xraySlug" element={<AnalysisEdit />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
 
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${config.API_URL}/api/xrays/${xraySlug}`
      );
    });
 
    // ✅ Instead of checking for a single fetch call, ensure this specific call was made
    expect(globalThis.fetch).toHaveBeenCalledTimes(2); // Since abnormalities API call happens too
  });
 
  it("fetches abnormalities successfully", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ json: async () => ({ url: "mock-xray-url" }) }) // First fetch call for X-ray data
      .mockResolvedValueOnce({
        json: async () => [{ id: 1, name: "mock-abnormality" }],
      });
 
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/analysis-edit/${xraySlug}`]}>
          <Routes>
            <Route path="/analysis-edit/:xraySlug" element={<AnalysisEdit />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
 
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${config.API_URL}/api/xrays/${xraySlug}/abnormalities`
      );
    });
 
    expect(globalThis.fetch).toHaveBeenCalledTimes(2); // Since both API calls happen
  });
 
  it("handles failure when fetching X-ray data", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("X-ray data fetch failed"));
 
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/analysis-edit/${xraySlug}`]}>
          <Routes>
            <Route path="/analysis-edit/:xraySlug" element={<AnalysisEdit />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
 
    await waitFor(() => {
      // Ensure X-ray fetch failure is logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error fetching X-ray data:/),
        expect.any(Error)
      );
    });
 
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
 
  it("handles failure when fetching abnormalities", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ json: async () => ({ url: "mock-xray-url" }) }) // First call succeeds
      .mockRejectedValueOnce(new Error("Abnormalities fetch failed")); // Second call fails
 
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/analysis-edit/${xraySlug}`]}>
          <Routes>
            <Route path="/analysis-edit/:xraySlug" element={<AnalysisEdit />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
 
    await waitFor(() => {
      // Ensure X-ray data was successfully fetched
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${config.API_URL}/api/xrays/${xraySlug}`
      );
 
      // Ensure abnormalities fetch failure is logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error fetching X-ray data:/),
        expect.any(Error)
      );
    });
 
    // Both API calls should have been attempted
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
 
  it("changes brightness using sliders", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
 
    const brightnessSlider = screen.getByTestId("brightness");
    expect(brightnessSlider).toBeInTheDocument();
 
    fireEvent.change(brightnessSlider, { target: {value: "1.5" } });
    expect(brightnessSlider.value).toBe("1.5");
  });
 
  it("changes contrast using sliders", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
 
    const contrastSlider = screen.getByTestId("contrast");
    expect(contrastSlider).toBeInTheDocument();
 
    fireEvent.change(contrastSlider, { target: {value: "1.2" } });
    expect(contrastSlider.value).toBe("1.2");
  });
 
  it("creates a box annotation", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    //  Click "Box Annotation" button
    const boxButton = screen.getByRole("button", { name: /Box Annotation/i });
    userEvent.click(boxButton);
  
    //  Draw a box on the canvas
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
  
    expect(screen.getByText("MockLabelModal")).toBeInTheDocument();
  });
 
  it("creates a oval annotation", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    //  Click "Oval Annotation" button
    const ovalButton = screen.getByRole("button", { name: /Oval Annotation/i });
    userEvent.click(ovalButton);
  
    //  Draw a oval on the canvas
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
  
    expect(screen.getByText("MockLabelModal")).toBeInTheDocument();
  });
  
  it("creates a point annotation", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    //  Click "Point Annotation" button
    const pointButton = screen.getByRole("button", { name: /Point Annotation/i });
    userEvent.click(pointButton);
  
    //  Draw a point on the canvas
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
  
    expect(screen.getByText("MockLabelModal")).toBeInTheDocument();
  });
 
  it("creates a free hand annotation", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    //  Click "Free Hand Annotation" button
    const freeHandButton = screen.getByRole("button", { name: /Free Hand Annotation/i });
    userEvent.click(freeHandButton);
  
    //  Draw a free hand on the canvas
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
  
    expect(screen.getByText("MockLabelModal")).toBeInTheDocument();
  });
 
  it("saves annotations to the backend", async () => {
    axios.post.mockResolvedValue({ status: 200 });
 
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
 
    // Click save annotations button
    const saveButton = screen.getByRole("button", { name: /Save Annotation/i });
    expect(saveButton).toBeInTheDocument();
 
    userEvent.click(saveButton);
 
    await waitFor(() => {
      // Ensure toast.success was called
      expect(toast.success).toHaveBeenCalledWith("Annotations saved");
    });
 
  });
 
  it("handles failure when saving annotations to the backend", async () => {
    axios.post.mockRejectedValue(new Error("Failed to save annotations"));
  
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    // Click save annotations button
    const saveButton = screen.getByRole("button", { name: /Save Annotation/i });
    expect(saveButton).toBeInTheDocument();
  
    userEvent.click(saveButton);
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error saving annotations.")
    });
  });
   
  it("failure when the API returns a non-200 status", async () => {
    axios.post.mockResolvedValue({ status: 500 }); // Mock a failed API response
  
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    // Click save annotations button
    const saveButton = screen.getByRole("button", { name: /Save Annotation/i });
    expect(saveButton).toBeInTheDocument();
 
    userEvent.click(saveButton);
  
    await waitFor(() => {
      // Ensure "Failed to save annotations" is logged
      expect(toast.error).toHaveBeenCalledWith("Failed to save anotations");
    });
  });
 
  // it("downloads annotated image successfully", async () => {
  //   // Mock `toBlob` method
  //   HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  //     callback(new Blob()); // Simulate successful blob creation
  //   });
 
  //   const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  
  //   render(
  //     <Provider store={store}>
  //       <MemoryRouter>
  //         <AnalysisEdit />
  //       </MemoryRouter>
  //     </Provider>
  //   );
  
  //   // Find and click the download button
  //   const downloadButton = screen.getByTestId("download-annotation");
  //   expect(downloadButton).toBeInTheDocument();
  //   userEvent.click(downloadButton);
  
  //   await waitFor(() => {
  //     expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
  //   });
  
  //   await waitFor(() => {
  //     expect(alertSpy).toHaveBeenCalledWith("Annotated Image downloaded successfully!");
  //   });
  //   alertSpy.mockRestore();
  // });
  
  it("fails to download annotated image", async () => {
    // Mock `toBlob` to fail (callback gets null)
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(null); // Simulate failure in blob creation
    });
  
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, "error");
    
    // Spy on `window.alert`
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    // Find and click the download button
    const downloadButton = screen.getByTestId("download-annotation");
    expect(downloadButton).toBeInTheDocument();
    userEvent.click(downloadButton);
  
    await waitFor(() => {
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
    });
  
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Error downloading canvas image:/),
        expect.any(Error)
      );
    });
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to download the image. Please try again.");
    });
  
    // Cleanup the spies
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });
 
  it("performs undo operation correctly", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    // Click "Box Annotation" button
    const boxButton = screen.getByRole("button", { name: /Box Annotation/i });
    userEvent.click(boxButton);
  
    // Draw a box annotation
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
  
    // Ensure an annotation was created
    expect(localStorage.getItem("annotations_mock-xraySlug")).not.toBeNull();
  
    // Click Undo button
    const undoButton = screen.getByRole("button", { name: /Undo/i });
    userEvent.click(undoButton);
  
    await waitFor(() => {
      // Check that annotations list in localStorage is empty after undo
      expect(JSON.parse(localStorage.getItem("annotations_mock-xraySlug"))).toHaveLength(0);
    });
  });
  
  it("performs redo operations correctly", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    // Click "Box Annotation" button
    const boxButton = screen.getByRole("button", { name: /Box Annotation/i });
    userEvent.click(boxButton);
  
    // Draw a box annotation
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
  
    // Get saved annotations
    let savedAnnotations = JSON.parse(localStorage.getItem("annotations_mock-xraySlug"));
  
    expect(savedAnnotations).not.toBeNull();
  
    // Click Undo button
    const undoButton = screen.getByRole("button", { name: /Undo/i });
    userEvent.click(undoButton);
  
    await waitFor(() => {
      const updatedAnnotations = JSON.parse(localStorage.getItem("annotations_mock-xraySlug"));
      expect(updatedAnnotations).toHaveLength(0);
    });
  
    // Click Redo button
    const redoButton = screen.getByRole("button", { name: /Redo/i });
    userEvent.click(redoButton);
  
    await waitFor(() => {
      const restoredAnnotations = JSON.parse(localStorage.getItem("annotations_mock-xraySlug"));
      expect(restoredAnnotations).not.toBeNull();
    });
  });
 
  it("performs reset operation correctly", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AnalysisEdit />
        </MemoryRouter>
      </Provider>
    );
  
    // Click "Box Annotation" button
    const boxButton = screen.getByRole("button", { name: /Box Annotation/i });
    userEvent.click(boxButton);
  
    // Draw a box annotation
    const canvas = screen.getByTestId("drawing-canvas");
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);
 
    // Draw another box annotation
    fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
    fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 });
    fireEvent.mouseUp(canvas);
  
    // Get saved annotations
    let savedAnnotations = JSON.parse(localStorage.getItem("annotations_mock-xraySlug"));
    expect(savedAnnotations).not.toBeNull();
  
    // Click Undo button
    const resetButton = screen.getByRole("button", { name: /Reset/i });
    userEvent.click(resetButton);
  
    await waitFor(() => {
      const updatedAnnotations = JSON.parse(localStorage.getItem("annotations_mock-xraySlug"));
      expect(updatedAnnotations).toHaveLength(0);
    });
  });
 
  // it("toggles negative mode correctly", async () => {
  //   render(
  //     <Provider store={store}>
  //       <MemoryRouter>
  //         <AnalysisEdit />
  //       </MemoryRouter>
  //     </Provider>
  //   );
  
  //   const negativeButton = screen.getByRole("button", { name: /Negative/i });
  //   expect(negativeButton).toBeInTheDocument();
  
  //   console.log("Negative button found in DOM!");
  
  //   userEvent.click(negativeButton);
  //   console.log("Negative button clicked!");
  
  //   await waitFor(() => {
  //     const canvas = screen.getByTestId("drawing-canvas");
  //     console.log("Canvas filter after enabling Negative mode:", canvas.style.filter);
  //     expect(canvas.style.filter).toContain("invert(1)");
  //   });
  
  //   userEvent.click(negativeButton);
  //   console.log("Negative button clicked again!");
  
  //   await waitFor(() => {
  //     const canvas = screen.getByTestId("drawing-canvas");
  //     console.log("Canvas filter after disabling Negative mode:", canvas.style.filter);
  //     expect(canvas.style.filter).not.toContain("invert(1)");
  //   });
  // });
});
 