const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  try {
    // Login (replace with your actual credentials)
    const loginResponse = await axios.post('https://api.mygstrefund.com/api/v1/login', {
      email: 'arun.pandey@mygstrefund.com',
      password: 'ARUNgstrefund1508@@',
    });

    const token = loginResponse.data.data.token;
    localStorage.setItem('token', token);

    // GSTIN Existence Check
    const gstinResponse = await axios.get(`https://api.mygstrefund.com/api/v1/gstin/exists?gstin=${formData.gstin}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (gstinResponse.data.data.exists) {
      // GSTIN exists, proceed with OTP check
      const refundCalculate = await axios.post('https://api.mygstrefund.com/api/v1/refund/calculate', {
        gstin_id: gstinResponse.data.data.gstin.id,
        refund_type_id: formData.refundType,
        from: fromMonthYear,
        to: toMonthYear
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const calculateId = refundCalculate.data.data.id;
      if (refundCalculate.status === 200) {
        // Hit additional API (handle response appropriately)
        const refundedValue = await axios.get(`https://api.mygstrefund.com/api/v1/refund/calculate/${calculateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRefundedValue(refundedValue.data.data);
        // Reset form
        // resetForm();
      } else {
        // Handle error based on refundCalculate status code
        if (refundCalculate.status === 400) {
          // Refund calculation error (400)
          toast.error("Invalid request for refund calculation. Please check your input data.");
          setShowOtpPopup(true); // Show OTP popup even on 400 error
        } else {
          // Other error during refundCalculate
          toast.error("An error occurred during refund calculation.");
        }
      }
    } else {
      // GSTIN doesn't exist, try adding it
      // ... (rest of your code for adding GSTIN)
    }
  } catch (error) {
    console.error('Error:', error);

    // Check if error occurred during addGstinResponse
    if (error.config && error.config.url.endsWith('https://api.mygstrefund.com/api/v1/gstin')) {
      toast.error("Invalid GSTIN,Please fill valid GSTIN");
    } else {
      toast.error("An error occurred during the process.");
    }
  } finally {
    setLoading(false);
  }
};
