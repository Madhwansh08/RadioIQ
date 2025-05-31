import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, it, vi, expect, beforeEach } from "vitest";
import store from "../redux/store";
import Upload from "../screens/Upload";
import { ToastContainer } from "react-toastify";


// Mock dependencies
vi.mock("axios", () => ({
  post: vi.fn(() => Promise.resolve({})),
  get: vi.fn(() => Promise.resolve({ data: { results: [] } })),
}));

vi.mock("react-icons/tfi", () => ({
  TfiUpload: () => <span>MockUploadIcon</span>,
}));

vi.mock("react-icons/md", () => ({
  MdOutlineKeyboardArrowRight: () => <span>MockNextIcon</span>,
  MdOutlineKeyboardArrowLeft: () => <span>MockPrevIcon</span>,
}));

vi.mock("../components/InstructionSlider", () => ({
  default: () => <div>MockInstructionSlider</div>,
}));

vi.mock("../components/Header", () => ({
  default: () => <div>MockHeader</div>,
}));

vi.mock("../components/BarLoader", () => ({
    BarLoader: () => <div data-testid="bar-loader">MockBarLoader</div>,
  }));
  

describe("Upload Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header and upload button", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Upload />
        </MemoryRouter>
      </Provider>
    );
  
    // Wait for the mock header to appear
    expect(await screen.findByText("MockHeader")).toBeInTheDocument();
  
    // Ensure the main elements are present
    expect(screen.getByText(/Kindly Upload X-ray Images/i)).toBeInTheDocument();
  });
  

  it("displays InstructionSlider component", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Upload />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText("MockInstructionSlider")).toBeInTheDocument();
  });

// it("handles file upload and shows BarLoader", async () => {
//     const file = new File(["dummy content"], "test.dicom", { type: "application/dicom" });

//     render(
//       <Provider store={store}>
//         <MemoryRouter>
//           <ToastContainer />
//           <Upload />
//         </MemoryRouter>
//       </Provider>
//     );

//     const uploadInput = screen.getByTestId("dicom-upload");

//     await act(async () => {
//       fireEvent.change(uploadInput, { target: { files: [file] } });
//     });

//     // Wait for the BarLoader to appear (uploading state should be true)
//     await waitFor(() => {
//       expect(screen.getByTestId("bar-loader")).toBeInTheDocument();
//     });
//   });
  

  it("displays error for invalid file types", async () => {
    const invalidFile = new File(["dummy content"], "test.txt", { type: "text/plain" });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Upload />
        </MemoryRouter>
      </Provider>
    );

    const uploadInput = screen.getByTestId("dicom-upload");
    await act(async () => {
      fireEvent.change(uploadInput, { target: { files: [invalidFile] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Please upload .dicom files/i)).toBeInTheDocument();
    });
  });

  it("renders table data if available", () => {
    const mockTableData = [
      {
        patientId: "12345",
        sex: "Male",
        age: "30",
        location: "New York, USA",
        xray: "mockXray",
      },
    ];

    store.dispatch({
      type: "table/setTableData",
      payload: mockTableData,
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Upload />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByDisplayValue("12345")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Male")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
    expect(screen.getByDisplayValue("New York, USA")).toBeInTheDocument();
  });
});
