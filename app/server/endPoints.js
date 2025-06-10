const { getVerificationStatus } = require("./controllers/authController");

// Authentication Routes
const register = '/register';
const login = '/login';
const logout='/logout';
// const requestPasswordReset = '/request-password-reset';
// const verifyOTP = '/verify-otp';
const resetPassword = '/reset-password';
const userAuth = '/user-auth';
const updateDoctor = '/update';
const uploadProfilePicture = '/upload-profile-picture';
const getProfilePicture = '/get-profile-picture';
const getDoctor = '/get-doctor';
const secureRegister = '/secureRegister';
const verifyRegistrationOTP = '/verifyRegistrationOTP';
const getVerficationStatus='/get/verificationStatus'
const requestVerificationOTP='/request-verification-otp'
const verifyVerificationOTP='/verify-verification-otp'
 
// Contact Routes
const submitContactForm = '/submit';
 
// Patient Routes
const getPatientBySlug = '/:slug';
const getPatientHistory = '/:slug/history';
const findPatientsWithSimilarAbnormalities = '/:slug/similar';
const getAllPatients = '/get/AllPatients';
 
// Report Routes
const generateReport = '/:patientSlug/:xraySlug/report';
const getAllReports = '/get/AllReports';
 
// Xray Routes
const updateDicomXray = '/dicom/update';
const getXrayBySlug = '/:slug';
const getXrayAbnormalities = '/:slug/abnormalities';
const getAllXrays = '/get/AllXrays';
const getAllXrayObjects = '/get/AllXraysObjects';
const getAllAbnormalities = '/get/AllAbnormalities';
const uploadMultipleDicomXray = '/dicom/uploadMultiple';
const editXray = '/edit';
const getCommonAbnormalities = '/get/CommonAbnormalities';
const getXrayData = '/get/XrayDay';
const getRecentXrays = '/get/RecentXrays';
const getAbnormalityByAge = '/get/AbnormalityByAge';
const getAbnormalityByGender = '/get/AbnormalityByGender';
const getAbnormalityByLocation = '/get/AbnormalityByLocation';
const getNormalAbnormalXrays='/get/NormalAbnormalXrays'
const updateXrayBySlug='/dicom/update/:slug'
const uploadMetaDataDicom='/dicom/upload/metadata'
const getHeatMapLink='/get/heatmap'

//usb Routes
const usbFilesRoutes = require('./Routes/usbFilesRoutes');
 
// Server Routes
const eventStream = '/events';
 
// Use Routes
const useXrayRoutes = '/api/xrays';
const usePatientRoutes = '/api/patients';
const useAuthRoutes = '/api/auth';
const useContactRoutes = '/api/contact';
const useReportRoutes = '/api/reports';
 
module.exports = {
    register,
    login,
    logout,
    // requestPasswordReset,
    // verifyOTP,
    resetPassword,
    userAuth,
    submitContactForm,
    getPatientBySlug,
    getPatientHistory,
    findPatientsWithSimilarAbnormalities,
    getAllPatients,
    generateReport,
    getAllReports,
    updateDicomXray,
    getXrayBySlug,
    getXrayAbnormalities,
    getAllXrays,
    getAllXrayObjects,
    getAllAbnormalities,
    uploadMultipleDicomXray,
    editXray,
    eventStream,
    useXrayRoutes,
    usePatientRoutes,
    useAuthRoutes,
    useContactRoutes,
    useReportRoutes,
    updateDoctor,
    uploadProfilePicture,
    getProfilePicture,
    getDoctor,
    getCommonAbnormalities,
    getXrayData,
    getRecentXrays,
    getAbnormalityByAge,
    getAbnormalityByGender,
    getAbnormalityByLocation,
    secureRegister,
    verifyRegistrationOTP,
    getNormalAbnormalXrays,
    updateXrayBySlug,
    getVerficationStatus,
   requestVerificationOTP,
    verifyVerificationOTP,
    uploadMetaDataDicom,
    getHeatMapLink,
    usbFilesRoutes,
};