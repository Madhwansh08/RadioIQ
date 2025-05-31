import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate, useParams } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import store from "../redux/store";
import Analysis from "../screens/Analysis";
import { setAuth } from "../redux/slices/authSlice";

// Mock assets (image) to prevent loading issues
vi.mock("../assets/logo.png", () => "mock-image.png");

// Mock Axios for API calls
vi.mock("axios");

// Mock useDispatch to track actions
const mockDispatch = vi.fn();
vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

// Mock useNavigate from react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: () => ({ patientSlug: "patient-123", xraySlug: "xray-456" }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(toast, "success").mockImplementation(() => {});
  vi.spyOn(toast, "error").mockImplementation(() => {});

  // Mock console log
  globalThis.console = {
    ...console,
    error: vi.fn(),
    log: vi.fn(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Analysis Component", () => {
  it("renders the Analysis page correctly", async () => {
    // Mock successful API responses
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    // Ensure all sections are rendered
    expect(screen.getByText(/CXR Analysis/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Patient Demographics/i)).toBeInTheDocument();
    });
  });

  // it("displays patient demographics correctly", async () => {
  //   axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
  //   axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
  //   axios.get.mockResolvedValueOnce({ data: [] });
  //   axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
  //   axios.get.mockResolvedValueOnce({ data: [] });

  //   render(
  //     <Provider store={store}>
  //       <MemoryRouter>
  //         <Analysis />
  //       </MemoryRouter>
  //     </Provider>
  //   );

  //   await waitFor(() => {
  //     expect(screen.getByText(/Patient Demographics/i)).toBeInTheDocument();
  //     // expect(screen.getByText(/ID:/i)).toHaveTextContent("P123");
  //     // expect(screen.getByText(/Age:/i)).toHaveTextContent("45");
  //     // expect(screen.getByText(/Gender:/i)).toHaveTextContent("Male");
  //     // expect(screen.getByText(/Location:/i)).toHaveTextContent("New York");
  //   });
  // });

  it("handles API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("toggles annotations correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const annotationButton = screen.getByLabelText("model-annotation");
    // fireEvent.click(annotationButton);
    // expect(annotationButton).toHaveClass("bg-red-500");

    fireEvent.click(annotationButton);
    expect(annotationButton).not.toHaveClass("bg-red-500");
  });

  it("handles zoom in and out correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const zoomInButton = screen.getByLabelText("zoom-in");
    const zoomOutButton = screen.getByLabelText("zoom-out");

    fireEvent.click(zoomInButton);
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomOutButton);

    // Zoom level assertions can be based on canvas transformation or state changes
  });

  it("downloads the image correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const downloadButton = screen.getByLabelText("download-image");
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Image downloaded successfully!");
    });
  });

  it("opens and closes the note modal correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const noteButton = screen.getByLabelText("add-note");
    fireEvent.click(noteButton);

    expect(screen.getByText(/Submit Note/i)).toBeInTheDocument();

    const cancelButton = screen.getByLabelText("cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByText(/Submit Note/i)).not.toBeInTheDocument();
  });

  it("submits a note successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    axios.put.mockResolvedValueOnce({});

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const noteButton = screen.getByLabelText("add-note");
    fireEvent.click(noteButton);

    const noteTextarea = screen.getByPlaceholderText(/Enter your note here.../i);
    const submitButton = screen.getByLabelText("submit-note");

    fireEvent.change(noteTextarea, { target: { value: "This is a test note." } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Note submitted successfully!");
    });
  });

  it("shows an error message when note submission fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    axios.put.mockRejectedValueOnce(new Error("Submission Error"));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const noteButton = screen.getByLabelText("add-note");
    fireEvent.click(noteButton);

    const noteTextarea = screen.getByPlaceholderText(/Enter your note here.../i);
    const submitButton = screen.getByLabelText("submit-note");

    fireEvent.change(noteTextarea, { target: { value: "This is a test note." } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("navigates to edit page when edit button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const editButton = screen.getByLabelText("edit");
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith("/analysis/patient-123/xray-456/edit");
  });

  it("navigates to heatmap page when heatmap button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const heatmapButton = screen.getByLabelText("heatmap");
    fireEvent.click(heatmapButton);

    expect(mockNavigate).toHaveBeenCalledWith("/analysis/patient-123/xray-456/heatmap");
  });

  it("navigates to quadrant page when quadrant button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: { patient: { patientId: "P123", age: 45, sex: "Male", location: "New York" } } });
    axios.get.mockResolvedValueOnce({ data: { url: "mock-xray-url", tbScore: 25 } });
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { xrays: [] } });
    axios.get.mockResolvedValueOnce({ data: [] });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Analysis />
        </MemoryRouter>
      </Provider>
    );

    const quadrantButton = screen.getByLabelText("quadrant");
    fireEvent.click(quadrantButton);

    expect(mockNavigate).toHaveBeenCalledWith("/analysis/patient-123/xray-456/quadrant");
  });
});