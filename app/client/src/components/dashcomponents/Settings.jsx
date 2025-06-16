import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateAuth } from "../../redux/slices/authSlice";
import axios from "axios";
import config from "../../utils/config";
import { toast } from "react-toastify";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
 
const UpdateProfile = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const token = auth?.token;
 
  // Initialize formData with auth.user values
  const [formData, setFormData] = useState({
    name: auth.user?.name || "",
    phoneNumber: auth.user?.phoneNumber || "", // Changed from phone to phoneNumber
    dob: auth.user?.dob ? new Date(auth.user?.dob).toISOString().split("T")[0] : "",
    location: auth.user?.location || "",
    hospital: auth.user?.hospital || "",
    specialization: auth.user?.specialization || "",
    gender: auth.user?.gender || "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(
    auth?.profilePicture || "https://via.placeholder.com/150"
  );
 
  useEffect(() => {
    if (token) {
      const fetchDoctorDetails = async () => {
        try {
          const response = await axios.get(
            `${config.API_URL}/api/auth/get-doctor`,
            { withCredentials: true }
          );
          const doctor = response.data;
          setFormData({
            name: doctor.name || "",
            phoneNumber: doctor.phoneNumber || "", // Changed from phone to phoneNumber
            dob: doctor.dob ? new Date(doctor.dob).toISOString().split("T")[0] : "",
            location: doctor.location || "",
            hospital: doctor.hospital || "",
            specialization: doctor.specialization || "",
            gender: doctor.gender || "",
          });
          setPreview(doctor.profilePicture || "https://via.placeholder.com/150");
        } catch (error) {
          console.error("Error fetching doctor details:", error);
          toast.error("Failed to fetch doctor details.");
        }
      };
      fetchDoctorDetails();
    }
  }, [token]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };
 
  const handleProfilePicUpload = async () => {
    if (!profilePic) {
      alert("Please select a profile picture to upload.");
      return;
    }
    const data = new FormData();
    data.append("profilePicture", profilePic);
    try {
      const response = await axios.post(
        `${config.API_URL}/api/auth/upload-profile-picture`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      const updatedProfilePicture = response.data.profilePicture;
      dispatch(updateAuth({ profilePicture: updatedProfilePicture }));
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture.");
    }
  };
 
  const handleDetailsUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${config.API_URL}/api/auth/update`,
        formData,
        { withCredentials: true }
      );
      const updatedUser = response.data.user || { ...auth.user, ...formData };
      dispatch(
        updateAuth({
          user: updatedUser,
          token: token,
          profilePicture: auth.profilePicture,
        })
      );
      toast.success("Profile details updated successfully!");
    } catch (error) {
      console.error("Error updating profile details:", error);
      alert("Failed to update profile details.");
    }
  };
 
  console.log("Doctor dob", auth.user?.dob);
  console.log("Phone number", auth.user?.phoneNumber);
 
  return (
      <div className="w-full h-full bg-[#030811] dark:bg-[#fdfdfd] py-8 px-4">
        <form
          onSubmit={handleDetailsUpdate}
          className="space-y-12 max-w-4xl mx-auto bg-white dark:bg-[#fdfdfd] p-8 rounded-lg "
        >
          {/* Profile Section */}
          {/* <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#030811]">
                Profile
              </h2>
              <p className="mt-1 text-sm/6 text-gray-600 dark:text-[#030811]">
                Update your profile picture.
              </p>
            </div>
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
              <div className="sm:col-span-4">
                <label
                  htmlFor="profile-picture"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Photo
                </label>
                <div className="mt-2 flex items-center gap-x-3">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="size-12 text-gray-300" />
                  )}
                  <label className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleProfilePicChange}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleProfilePicUpload}
                    className="rounded-md bg-[#5c60c6] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div> */}
          {/* Personal Information Section */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
            <div>
              <h2 className="text-base/7 font-semibold text-gray-900 dark:text-[#030811]">
                Personal Information
              </h2>
              <p className="mt-1 text-sm/6 text-gray-600 dark:text-[#030811]">
                Update your personal details.
              </p>
            </div>
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
              {/* Email (Disabled) */}
              <div className="sm:col-span-6">
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={auth?.user?.email || ""}
                    disabled
                    className="block w-full rounded-md bg-white dark:bg-gray-100 px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Name */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="name"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Name
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={auth.user?.name || "Your Name"}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Phone Number */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Phone Number
                </label>
                <div className="mt-2">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder={auth.user?.phoneNumber || "Your Phone Number"}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Location */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="location"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Location
                </label>
                <div className="mt-2">
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={auth.user?.location || "Your Location"}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Hospital */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="hospital"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Hospital
                </label>
                <div className="mt-2">
                  <input
                    id="hospital"
                    name="hospital"
                    type="text"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder={auth.user?.hospital || "Your Hospital"}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Specialization */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="specialization"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Specialization
                </label>
                <div className="mt-2">
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder={auth.user?.specialization || "Your Specialization"}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Gender */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="gender"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Gender
                </label>
                <div className="mt-2">
                  <input
                    id="gender"
                    name="gender"
                    type="text"
                    value={formData.gender}
                    onChange={handleChange}
                    placeholder={auth.user?.gender || "Your Gender"}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              {/* Date of Birth */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="dob"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-[#030811]"
                >
                  Date of Birth
                </label>
                <div className="mt-2">
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    className="block w-full rounded-md bg-white dark:bg-[#fdfdfd] px-3 py-1.5 text-base text-gray-900 dark:text-[#030811] outline outline-1 -outline-offset-1 outline-gray-300 focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button type="button" className="text-sm/6 font-semibold text-gray-900 dark:text-[#030811]">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#5c60c6] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
  );
};
 
export default UpdateProfile;