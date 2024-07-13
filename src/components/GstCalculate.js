import React, { useState } from 'react';
import axios from 'axios';
import logo from "../assets/image.png";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GstCalculate = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gstin: '',
    gstinusername:'',
    refundType: '',
    fromDate: '',
    toDate: '',
    otp: '',
    capitaField: '',
    inputServices: '',
    procurementOther: '',
    capitaGoods: '',
  });
  const [loading, setLoading] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showInactivePopup, setShowInactivePopup] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [refundedValue, setRefundedValue] = useState(null);

  const fromDate = new Date(formData.fromDate);
  const toDate = new Date(formData.toDate);

  const fromMonthYear = `${('0' + (fromDate.getMonth() + 1)).slice(-2)}${fromDate.getFullYear()}`;
  const toMonthYear = `${('0' + (toDate.getMonth() + 1)).slice(-2)}${toDate.getFullYear()}`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      gstin: '',
      gstinusername:'',
      refundType: '',
      fromDate: '',
      toDate: '',
      otp: '',
      capitaField: '',
      inputServices: '',
      procurementOther: '',
      capitaGoods: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginResponse = await axios.post('https://api.mygstrefund.com/api/v1/login', {
        email: 'arun.pandey@mygstrefund.com',
        password: 'ARUNgstrefund1508@@',
      });

      const token = loginResponse.data.data.token;
      localStorage.setItem('token', token);

      const gstinResponse = await axios.get(`https://api.mygstrefund.com/api/v1/gstin/exists?gstin=${formData.gstin}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const gstinId = gstinResponse.data.data.gstin.id;

      if (gstinResponse.data.success && gstinResponse.data.data.gstin) {
        // GSTIN exists, proceed with OTP check
        const refundCalculate = await axios.post('https://api.mygstrefund.com/api/v1/refund/calculate', {
          gstin_id: gstinId,
          refund_type_id: formData.refundType,
          from: fromMonthYear,
          to: toMonthYear
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const trackId = refundCalculate.data.data.track_id;
        const calculateId = refundCalculate.data.data.id;

        if (refundCalculate.status === 200) {

           // Hit additional API
           const refundedValue = await axios.get(`https://api.mygstrefund.com/api/v1/refund/calculate/417`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRefundedValue(refundedValue.data.data);

          // Reset form
          resetForm();

        } else {
          setShowOtpPopup(true);
        }
      } else if (gstinResponse.data.success && !gstinResponse.data.data.gstin) {
        const addGstinResponse = await axios.post('https://api.mygstrefund.com/api/v1/gstin', {
          gstin: formData.gstin,
          gst_username: formData.gstinusername,
          company_name: "ccc"
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (addGstinResponse.status === 200) {
          const gstinResponse = await axios.get(`https://api.mygstrefund.com/api/v1/gstin/exists?gstin=${formData.gstin}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const gstinIdAfterCreated = gstinResponse.data.data.gstin.id;
          const otpResponse = await axios.get(`https://api.mygstrefund.com/api/api/v1/gstin/otp/request/${gstinIdAfterCreated}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (otpResponse.status === 200) {
            setShowOtpPopup(true);
          } else {
            setShowInactivePopup(true);
          }
        } else {
          toast.error("Invalid GSTIN.");
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred during the process.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const calculateResponse = await axios.post('https://third-party-api.com/calculate', {
        otp: formData.otp,
        ...formData,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCalculationResult(calculateResponse.data);

      // await axios.post('/api/save-user', formData);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setShowOtpPopup(false);
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
              <td className="border px-4 py-2" colSpan="5">Please select valid from to dates</td>
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
            <td className="border px-4 py-2">{refundedValue.eligible_refund_amount ?? 0}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const handlePdfDownload = async () => {
    setLoading(true);
    try {
      // Perform API call to get PDF URL
      const response = await axios.get('https://api.mygstrefund.com/api/v1/refund/pdf/download', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // Update state with PDF URL
      setPdfUrl(response.data.data.url);

      // Display success message
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-screen bg-gray-100">
      {loading && <div className="loader">Loading...</div>}
      <form className="bg-white p-8 rounded w-full" onSubmit={handleSubmit}>
        <div className="flex justify-center">
          <img src={logo} alt="logo" className="h-20 w-20 object-contain" />
          {pdfUrl && (
            <div className="pdf-popup">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline" download onClick={handlePdfDownload}>Download PDF</a>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold mt-4 mb-2 text-center">GSTCalculation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="form-input" type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input className="form-input" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input className="form-input" type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
          <input className="form-input" type="text" name="gstin" placeholder="GSTIN" value={formData.gstin} onChange={handleChange} required />
          <input className="form-input col-span-2" type="text" name="gstinusername" placeholder="GSTIN Username" value={formData.gstinusername} onChange={handleChange} required />
          <div className="col-span-2">
            <select className="form-input w-full" name="refundType" value={formData.refundType} onChange={handleChange} required>
              <option value="">Select Refund Type</option>
              <option value="1">Refund of Excess Balance in Cash Ledger TCS & TDS</option>
              <option value="2">Refund on account of ITC accumulated due to Inverted duty Structure</option>
              <option value="3">Export without Payment of Tax (With LUT)</option>
            </select>
          </div>

          {formData.refundType === '2' && (
            <div className="mt-4 col-span-2">
              <label>Capita Field to Total ITC Ratio %</label>
              <input className="form-input" type="text" name="capitaField" value={formData.capitaField} onChange={handleChange} required />
              <label>Input Services to Total ITC Ratio %</label>
              <input className="form-input" type="text" name="inputServices" value={formData.inputServices} onChange={handleChange} required />
              <label>Do you have any procurement other than services at 18%?</label>
              <select className="form-input" name="procurementOther" value={formData.procurementOther} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          )}

          {formData.refundType === '3' && (
            <div className="mt-4 col-span-2">
              <label>Capita Goods to Total ITC Ratio %</label>
              <input className="form-input" type="text" name="capitaGoods" value={formData.capitaGoods} onChange={handleChange} required />
            </div>
          )}
          <input className="form-input" type="date" name="fromDate" placeholder="From Date" value={formData.fromDate} onChange={handleChange} required />
          <input className="form-input" type="date" name="toDate" placeholder="To Date" value={formData.toDate} onChange={handleChange} required />
        </div>
        <button className="bg-blue-500 text-white mt-4 py-2 px-4 rounded" type="submit">Calculate</button>

        {refundedValue && renderRefundedTable()}

      </form>

      {showOtpPopup && (
        <div className="otp-popup">
          <h2>Enter OTP</h2>
          <input type="text" name="otp" value={formData.otp} onChange={handleChange} />
          <button onClick={verifyOtp}>Verify OTP</button>
        </div>
      )}

      {showInactivePopup && (
        <div className="inactive-popup">
          <h2>Oops!</h2>
          <p>This GSTIN is not registered. Please register with your GSTIN.</p>
        </div>
      )}

      {calculationResult && (
        <div className="result-popup">
          <h2>Calculation Result</h2>
          <pre>{JSON.stringify(calculationResult, null, 2)}</pre>
        </div>
      )}

      
    </div>
  );
};

export default GstCalculate;
