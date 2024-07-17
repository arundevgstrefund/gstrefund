import React, { useState } from "react";
import axios from "axios";
import logo from "../assets/image.png";
import Modal from "react-modal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GstCalculate = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gstin: "",
    gstinusername: "",
    refundType: "",
    fromDate: "",
    toDate: "",
    otp: "",
    capitaField: "",
    inputServices: "",
    procurementOther: "",
    capitaGoods: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showInactivePopup, setShowInactivePopup] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [refundedValue, setRefundedValue] = useState(null);
  const [gstinId, setGstinId] = useState("");
  const [calculateId, setCalculateId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fromDate = new Date(formData.fromDate);
  const toDate = new Date(formData.toDate);

  const fromMonthYear = `${("0" + (fromDate.getMonth() + 1)).slice(
    -2
  )}${fromDate.getFullYear()}`;
  const toMonthYear = `${("0" + (toDate.getMonth() + 1)).slice(
    -2
  )}${toDate.getFullYear()}`;

  const validateForm = () => {
    const newErrors = {};
    const { name, email, phone, gstin } = formData;

    if (!name) newErrors.name = "Please fill Name";
    if (!email) newErrors.email = "Please fill Email";
    if (!phone) newErrors.phone = "Please fill Phone";
    if (!gstin) newErrors.gstin = "Please fill GSTIN";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email))
      newErrors.email = "Please fill valid Email";

    const phonePattern = /^[0-9]{10}$/;
    if (phone && !phonePattern.test(phone))
      newErrors.phone = "Please fill valid Phone";

    const gstinPattern =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstin && !gstinPattern.test(gstin))
      newErrors.gstin = "Please fill valid GSTIN";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      gstin: "",
      gstinusername: "",
      refundType: "",
      fromDate: "",
      toDate: "",
      otp: "",
      capitaField: "",
      inputServices: "",
      procurementOther: "",
      capitaGoods: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = await getAuthToken();
      localStorage.setItem("token", token);

      const gstinExists = await checkGstinExistence(token);
      if (gstinExists) {
        await processRefund(token);
      } else {
        await addGstin(token);
        await checkGstinExistence(token);
        await requestOtp(token);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    const response = await axios.post(
      "https://api.mygstrefund.com/api/v1/login",
      {
        email: "arun.pandey@mygstrefund.com",
        password: "ARUNgstrefund1508@@",
      }
    );
    return response.data.data.token;
  };

  const checkGstinExistence = async (token) => {
    const response = await axios.get(
      `https://api.mygstrefund.com/api/v1/gstin/exists?gstin=${formData.gstin}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const gstinExists = response.data.data.exists;
    setGstinId(response.data.data.gstin.id);
    return gstinExists;
  };
  
  const processRefund = async (token) => {
    try {
      const refundCalculate = await axios.post(
        "https://api.mygstrefund.com/api/v1/refund/calculate",
        {
          gstin_id: gstinId,
          refund_type_id: parseInt(formData.refundType, 10),
          from: fromMonthYear,
          to: toMonthYear,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const calculateId = refundCalculate.data.data.id;
      setCalculateId(calculateId);

      if (refundCalculate.status === 200) {
        const refundedValue = await axios.get(
          `https://api.mygstrefund.com/api/v1/refund/calculate/${calculateId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setRefundedValue(refundedValue.data.data);
        const trackId = refundCalculate.data.data.track_id;
        setTrackId(trackId);

        const pdfResponse = await axios.get(
          `https://api.mygstrefund.com/api/v1/report/export/${trackId}/pdf`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json, text/plain, */*",
            },
            responseType: "blob",
          }
        );

        const pdfBlob = new Blob([pdfResponse.data], {
          type: "application/pdf",
        });

        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl);

        // Optionally, reset the form
        // resetForm();
      } else {
        handleRefundError(refundCalculate);
      }
    } catch (refundCalculateError) {
      toast.error("Please activate your GSTIN via OTP");
      setShowOtpPopup(true);
      await requestOtp(token);
    }
  };

  const addGstin = async (token) => {
    await axios.post(
      "https://api.mygstrefund.com/api/v1/gstin",
      {
        gstin: formData.gstin,
        gst_username: formData.gstinusername,
        company_name: "ccc",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  const requestOtp = async (token) => {
    await axios.get(
      `https://api.mygstrefund.com/api/v1/gstin/otp/request/${gstinId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  const handleError = (error) => {
    console.error("Error:", error);
    if (
      error.config &&
      error.config.url.endsWith("https://api.mygstrefund.com/api/v1/gstin")
    ) {
      toast.error("Invalid GSTIN, Please fill valid GSTIN");
    } else {
      toast.error("An error occurred during the process.");
    }
  };

  const handleRefundError = (refundCalculate) => {
    if (refundCalculate.status === 400) {
      console.log("Refund Calculation Error Response:", refundCalculate.data);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        `https://api.mygstrefund.com/api/v1/gstin/otp/verify/${gstinId}`,
        {
          otp: formData.otp,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setCalculationResult(response.data);
        toast.success("Now your GSTIN is active");
        setShowOtpPopup(false);
        await processRefund(token);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Invalid OTP, please try again");
    } finally {
      setLoading(false);
    }
  };

  const renderRefundedTable = () => {
    if (!refundedValue || refundedValue.length === 0) {
      return (
        <table className="table-auto w-full mt-6">
          <thead>
            <tr>
              <th className="px-4 py-2">GSTIN</th>
              <th className="px-4 py-2">Refund Type</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">To</th>
              <th className="px-4 py-2">Eligible Refund Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2" colSpan="5">
                Please select valid from to dates
              </td>
              <td className="border px-4 py-2">0</td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <table className="table-auto w-full mt-6">
        <thead>
          <tr>
            <th className="px-4 py-2">GSTIN</th>
            <th className="px-4 py-2">Refund Type</th>
            <th className="px-4 py-2">Creator Name</th>
            <th className="px-4 py-2">From</th>
            <th className="px-4 py-2">To</th>
            <th className="px-4 py-2">Eligible Refund Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">{refundedValue.gstin}</td>
            <td className="border px-4 py-2">{refundedValue.refund_type}</td>
            <td className="border px-4 py-2">{refundedValue.creator_name}</td>
            <td className="border px-4 py-2">{refundedValue.from}</td>
            <td className="border px-4 py-2">{refundedValue.to}</td>
            <td className="border px-4 py-2">
              {refundedValue.eligible_refund_amount ?? 0}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div className="container flex justify-center items-center min-h-screen bg-gray-100">
      {loading && <div className="loader">Loading...</div>}
      <form className="bg-white p-8 rounded w-full" onSubmit={handleSubmit}>
        <div class="flex justify-center items-center space-x-4">
          <div class="w-20 flex items-center justify-center">
            <img src={logo} alt="logo" class="h-full w-full object-contain" />
          </div>
          <div class="p-1 w-20 bg-[#232f3e] flex items-center justify-center">
            <img
              src="https://www.industrybuying.com/static/images/industry-buying-white-logo.png"
              alt="logo"
              class="h-full w-full object-contain"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-4 mb-5 text-center">
          GST Refund Calculation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className={`border ${
              errors.name ? "border-red-500" : "border-gray-300"
            } p-2 rounded-md`}
          />
          {errors.name && <span className="text-red-500">{errors.name}</span>}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={`border ${
              errors.email ? "border-red-500" : "border-gray-300"
            } p-2 rounded-md`}
          />
          {errors.email && <span className="text-red-500">{errors.email}</span>}
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className={`border ${
              errors.phone ? "border-red-500" : "border-gray-300"
            } p-2 rounded-md`}
          />
          {errors.phone && <span className="text-red-500">{errors.phone}</span>}
          <input
            type="text"
            name="gstin"
            placeholder="GSTIN"
            value={formData.gstin}
            onChange={handleChange}
            className={`border ${
              errors.gstin ? "border-red-500" : "border-gray-300"
            } p-2 rounded-md`}
          />
          {errors.gstin && <span className="text-red-500">{errors.gstin}</span>}
          <input
            className="form-input col-span-2"
            type="text"
            name="gstinusername"
            placeholder="GSTIN Username"
            value={formData.gstinusername}
            onChange={handleChange}
            required
          />
          <div className="col-span-2">
            <select
              className="form-input w-full"
              name="refundType"
              value={formData.refundType}
              onChange={handleChange}
              required
            >
              <option value="">Select Refund Type</option>
              <option value="2">
                Refund of Excess Balance in Cash Ledger TCS & TDS
              </option>
              <option value="3">
                Refund on account of ITC accumulated due to Inverted duty
                Structure
              </option>
              <option value="4">
                Export without Payment of Tax (With LUT)
              </option>
            </select>
          </div>

          {formData.refundType === "3" && (
            <div className="mt-4 col-span-2">
              <label>Capita Field to Total ITC Ratio %</label>
              <input
                className="form-input"
                type="text"
                name="capitaField"
                value={formData.capitaField}
                onChange={handleChange}
                required
              />
              <label>Input Services to Total ITC Ratio %</label>
              <input
                className="form-input"
                type="text"
                name="inputServices"
                value={formData.inputServices}
                onChange={handleChange}
                required
              />
              <label>
                Do you have any procurement other than services at 18%?
              </label>
              <select
                className="form-input"
                name="procurementOther"
                value={formData.procurementOther}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          )}

          {formData.refundType === "4" && (
            <div className="mt-4 col-span-2">
              <label>Capita Goods to Total ITC Ratio %</label>
              <input
                className="form-input"
                type="text"
                name="capitaGoods"
                value={formData.capitaGoods}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <input
            className="form-input"
            type="date"
            name="fromDate"
            placeholder="From Date"
            value={formData.fromDate}
            onChange={handleChange}
            required
          />
          <input
            className="form-input"
            type="date"
            name="toDate"
            placeholder="To Date"
            value={formData.toDate}
            onChange={handleChange}
            required
          />
        </div>
        <div class="flex justify-center">
          <button
            class="bg-red-700 text-white mt-4 py-2 px-4 rounded"
            type="submit"
          >
            Calculate
          </button>
        </div>

        {refundedValue && renderRefundedTable()}
      </form>
      {/* Make sure to bind modal to your appElement
      (http://reactcommunity.org/react-modal/accessibility/) */}
      {/* Modal.setAppElement('#root'); */}
      <div>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="YouTube Video"
        >
          <h2>Active your gstin</h2>
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/LaxoF8cBNsQ?si=EkrWfW_I-Gl6kPqi"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Video"
          ></iframe>
          <button onClick={() => setIsModalOpen(false)}>Close</button>
        </Modal>
      </div>
      {showOtpPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Enter OTP</h3>
            <input
              type="text"
              name="otp"
              placeholder="OTP"
              value={formData.otp}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded-md mb-4"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={verifyOtp}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={() => setShowOtpPopup(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showInactivePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Inactive GSTIN</h3>
            <p className="mb-4">The provided GSTIN is inactive.</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowInactivePopup(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {calculationResult && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Calculation Result</h3>
          <pre className="bg-gray-200 p-4 rounded-md">
            {JSON.stringify(calculationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GstCalculate;
