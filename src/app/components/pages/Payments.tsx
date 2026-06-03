import { Search, Filter, Send, CheckCircle, Clock, XCircle, Plus, X, Mail, Phone, DollarSign, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

// Backend API Configuration
// This points to your backend server that handles email sending
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
const EMAIL_API_ENDPOINT = `${BACKEND_API_URL}/api/send-payment-email`;

const payments = [
  {
    id: 1,
    customer: "Sarah Chen",
    company: "TechCorp",
    email: "sarah.chen@techcorp.com",
    amount: 2400,
    status: "paid",
    method: "M-Pesa",
    date: "Apr 11, 2026",
    time: "10:24 AM",
    avatar: "SC",
  },
  {
    id: 2,
    customer: "Michael Rodriguez",
    company: "StartupXYZ",
    email: "michael@startupxyz.com",
    amount: 2800,
    status: "pending",
    method: "Bank Transfer",
    date: "Apr 11, 2026",
    time: "9:15 AM",
    avatar: "MR",
  },
  {
    id: 3,
    customer: "David Park",
    company: "Growth Inc",
    email: "david.park@growthinc.com",
    amount: 1800,
    status: "paid",
    method: "M-Pesa",
    date: "Apr 10, 2026",
    time: "3:42 PM",
    avatar: "DP",
  },
  {
    id: 4,
    customer: "Anna Kim",
    company: "Tech Solutions",
    email: "anna.kim@techsolutions.com",
    amount: 3600,
    status: "paid",
    method: "Bank Transfer",
    date: "Apr 10, 2026",
    time: "11:20 AM",
    avatar: "AK",
  },
  {
    id: 5,
    customer: "Emma Williams",
    company: "Enterprise Co",
    email: "emma.williams@enterpriseco.com",
    amount: 3200,
    status: "pending",
    method: "M-Pesa",
    date: "Apr 9, 2026",
    time: "2:10 PM",
    avatar: "EW",
  },
  {
    id: 6,
    customer: "Lisa Anderson",
    company: "MegaCorp",
    email: "lisa.anderson@megacorp.com",
    amount: 5200,
    status: "overdue",
    method: "Bank Transfer",
    date: "Apr 8, 2026",
    time: "4:30 PM",
    avatar: "LA",
  },
  {
    id: 7,
    customer: "James Wilson",
    company: "Ventures Inc",
    email: "james.wilson@venturesinc.com",
    amount: 4100,
    status: "paid",
    method: "M-Pesa",
    date: "Apr 8, 2026",
    time: "1:15 PM",
    avatar: "JW",
  },
];

const statusConfig = {
  paid: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Paid" },
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100", label: "Pending" },
  overdue: { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Overdue" },
};

export function Payments() {
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [paymentRequestData, setPaymentRequestData] = useState({
    customerName: "",
    customerEmail: "",
    company: "",
    amount: "",
    description: "",
    dueDate: "",
    paymentMethod: "M-Pesa"
  });
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Check configuration on mount
  useEffect(() => {
    // Verify backend is accessible
    fetch(`${BACKEND_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        console.log('✓ Backend API is healthy:', data);
      })
      .catch(err => {
        console.warn('⚠️ Backend API not accessible at', BACKEND_API_URL);
        console.warn('Make sure to start the backend server: cd backend && npm start');
      });
  }, []);

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setPaymentRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle opening payment request modal
  const handleSendPaymentRequest = () => {
    setShowPaymentRequestModal(true);
    setRequestSent(false);
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Generate payment request email template
  const generatePaymentEmailTemplate = (data: typeof paymentRequestData) => {
    const dueDateText = data.dueDate ? ` due by ${new Date(data.dueDate).toLocaleDateString()}` : '';
    const companyText = data.company ? ` at ${data.company}` : '';

    return {
      to: data.customerEmail,
      subject: `Payment Request - $${data.amount}${companyText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Payment Request
          </h2>

          <p>Dear ${data.customerName},</p>

          <p>We hope this email finds you well. This is a payment request for the following:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; color: #007bff; font-size: 18px; font-weight: bold;">
                  $${parseFloat(data.amount).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Payment Method:</td>
                <td style="padding: 8px 0;">${data.paymentMethod}</td>
              </tr>
              ${data.dueDate ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Due Date:</td>
                <td style="padding: 8px 0;">${new Date(data.dueDate).toLocaleDateString()}</td>
              </tr>
              ` : ''}
              ${data.company ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Company:</td>
                <td style="padding: 8px 0;">${data.company}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${data.description ? `
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #333;">Description</h4>
            <p style="margin-bottom: 0;">${data.description}</p>
          </div>
          ` : ''}

          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #155724;">How to Pay</h4>
            <p style="margin-bottom: 0; color: #155724;">
              Please use the payment method specified above. If you have any questions about this payment request,
              feel free to reply to this email or contact our billing department.
            </p>
          </div>

          <p>Thank you for your prompt attention to this matter.</p>

          <p>Best regards,<br>
          LeadFlow AI Billing Team<br>
          billing@leadflow.ai<br>
          ${new Date().toLocaleDateString()}</p>
        </div>
      `,
      text: `
Payment Request

Dear ${data.customerName},

We hope this email finds you well. This is a payment request for the following:

Amount: $${parseFloat(data.amount).toLocaleString()}
Payment Method: ${data.paymentMethod}
${data.dueDate ? `Due Date: ${new Date(data.dueDate).toLocaleDateString()}` : ''}
${data.company ? `Company: ${data.company}` : ''}

${data.description ? `Description: ${data.description}` : ''}

Please use the payment method specified above. If you have any questions about this payment request,
feel free to reply to this email or contact our billing department.

Thank you for your prompt attention to this matter.

Best regards,
LeadFlow AI Billing Team
billing@leadflow.ai
${new Date().toLocaleDateString()}
      `
    };
  };

  // Send email function (via Backend API)
  const sendPaymentEmail = async (emailData: typeof paymentRequestData) => {
    const emailTemplate = generatePaymentEmailTemplate(emailData);

    console.log('Sending payment email to:', emailTemplate.to);

    try {
      // Send via Backend API
      const response = await fetch(EMAIL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTemplate.to,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          customerName: emailData.customerName,
          company: emailData.company,
          amount: emailData.amount,
          paymentMethod: emailData.paymentMethod,
          dueDate: emailData.dueDate,
          description: emailData.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Email service error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✓ Email sent successfully via backend:', result);
      return result;

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  // Handle sending payment request
  const handleSubmitPaymentRequest = async () => {
    // Clear previous errors
    setEmailError("");

    // Validate required fields
    if (!paymentRequestData.customerName.trim()) {
      setEmailError("Customer name is required");
      return;
    }

    if (!paymentRequestData.customerEmail.trim()) {
      setEmailError("Customer email is required");
      return;
    }

    if (!validateEmail(paymentRequestData.customerEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!paymentRequestData.amount || parseFloat(paymentRequestData.amount) <= 0) {
      setEmailError("Please enter a valid amount greater than 0");
      return;
    }

    setIsSendingRequest(true);

    try {
      // Send the payment email
      const emailResult = await sendPaymentEmail(paymentRequestData);

      console.log("Payment email sent successfully:", emailResult);

      // Show success state
      setRequestSent(true);

      // Reset form after successful submission
      setTimeout(() => {
        setShowPaymentRequestModal(false);
        setPaymentRequestData({
          customerName: "",
          customerEmail: "",
          company: "",
          amount: "",
          description: "",
          dueDate: "",
          paymentMethod: "M-Pesa"
        });
        setRequestSent(false);
        setEmailError("");
      }, 3000); // Show success message for 3 seconds

    } catch (error) {
      console.error("Error sending payment email:", error);
      setEmailError(
        error instanceof Error
          ? error.message
          : "Failed to send payment request email. Please try again."
      );
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Handle sending payment reminder
  const handleSendReminder = async (paymentId: number) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    try {
      // Create reminder email data
      const reminderData = {
        customerName: payment.customer,
        customerEmail: payment.email || `${payment.customer.toLowerCase().replace(' ', '.')}@example.com`,
        company: payment.company,
        amount: payment.amount.toString(),
        description: `Payment reminder for invoice #${payment.id}`,
        dueDate: new Date().toISOString().split('T')[0], // Today as due date for reminder
        paymentMethod: payment.method
      };

      // Send reminder email
      await sendPaymentEmail(reminderData);

      console.log("Payment reminder sent for payment:", payment);

      // Show success message
      alert(`Payment reminder sent successfully to ${payment.customer}`);

    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder. Please try again.");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Payments</h1>
          <p className="text-muted-foreground">Track and manage customer payments</p>
        </div>
        <button
          onClick={handleSendPaymentRequest}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Send Payment Request
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Total Paid</p>
          <p className="text-2xl font-semibold text-green-600">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">${totalPending.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">${totalOverdue.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Total Transactions</p>
          <p className="text-2xl font-semibold">{payments.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payments by customer or company..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border border-border"
          />
        </div>
        <button className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left">Customer</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Method</th>
              <th className="px-6 py-3 text-left">Date & Time</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const config = statusConfig[payment.status];
              const Icon = config.icon;
              return (
                <tr key={payment.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm flex-shrink-0">
                        {payment.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{payment.customer}</p>
                        <p className="text-sm text-muted-foreground">{payment.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">${payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 w-fit ${config.bg} ${config.color}`}>
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">{payment.method}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div>
                      <p>{payment.date}</p>
                      <p className="text-sm">{payment.time}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {payment.status !== "paid" && (
                      <button
                        onClick={() => handleSendReminder(payment.id)}
                        className="px-3 py-1 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
                      >
                        Send Reminder
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Request Modal */}
      {showPaymentRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Send Payment Request</h2>
              <button
                onClick={() => setShowPaymentRequestModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Payment Request Sent!</h3>
                <p className="text-muted-foreground">
                  Your payment request has been sent successfully to {paymentRequestData.customerName}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{emailError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={paymentRequestData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Customer Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={paymentRequestData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-input-background"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={paymentRequestData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={paymentRequestData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-input-background"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={paymentRequestData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={paymentRequestData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={paymentRequestData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Payment for services..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentRequestModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                    disabled={isSendingRequest}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPaymentRequest}
                    disabled={isSendingRequest}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSendingRequest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
