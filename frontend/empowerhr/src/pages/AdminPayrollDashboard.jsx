import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FiDollarSign, FiCheck, FiX, FiPlus, FiArrowLeft } from 'react-icons/fi';

const AdminPayrollDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [payrollForm, setPayrollForm] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        totalWorkingDays: 22,
        basicSalary: 50000,
        allowances: [
            { type: 'HRA', amount: 5000 },
            { type: 'Transport', amount: 3000 }
        ],
        deductions: [
            { type: 'PF', amount: 1800 },
            { type: 'Tax', amount: 2500 }
        ]
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = Cookies.get('token');
        const role = Cookies.get('userRole');

        if (!token || role !== 'admin') {
            navigate('/login');
            return;
        }

        // Fetch employees
        fetchEmployees();
    }, [navigate]);

    useEffect(() => {
        // Check for employeeId in URL query parameters
        const params = new URLSearchParams(location.search);
        const employeeId = params.get('employeeId');

        if (employeeId && employees.length > 0) {
            const employee = employees.find(emp => emp._id === employeeId);
            if (employee) {
                setSelectedEmployee(employee);
                setPayrollForm({
                    ...payrollForm,
                    basicSalary: employee.salary || 50000
                });
                setShowGenerateModal(true);
            }
        }
    }, [location.search, employees]);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await authenticatedFetch('/employees/all');
            const data = await parseJsonResponse(response);

            if (data && data.employees) {
                setEmployees(data.employees);
            } else {
                setError('Failed to load employees data');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError('Failed to load employees: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePayroll = async () => {
        if (!selectedEmployee) {
            setError('Please select an employee');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setSuccessMessage('');

            const payload = {
                employeeId: selectedEmployee._id,
                month: payrollForm.month,
                year: payrollForm.year,
                totalWorkingDays: payrollForm.totalWorkingDays,
                basicSalary: payrollForm.basicSalary,
                allowances: payrollForm.allowances,
                deductions: payrollForm.deductions
            };

            const response = await authenticatedFetch('/payrole/generate', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await parseJsonResponse(response);

            if (data && data.payroll) {
                setSuccessMessage('Payroll generated successfully!');
                setTimeout(() => {
                    setShowGenerateModal(false);
                    setSuccessMessage('');
                }, 2000);
            } else {
                setError('Failed to generate payroll: ' + (data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            setError('Failed to generate payroll: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprovePayroll = async (payrollId) => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccessMessage('');

            const response = await authenticatedFetch('/payrole/approve', {
                method: 'PATCH',
                body: JSON.stringify({ payrollId })
            });

            const data = await parseJsonResponse(response);

            if (data && data.payroll) {
                setSuccessMessage('Payroll approved successfully!');
                setTimeout(() => {
                    setSuccessMessage('');
                }, 2000);
            } else {
                setError('Failed to approve payroll: ' + (data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error approving payroll:', error);
            setError('Failed to approve payroll: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Helper function to get month name
    const getMonthName = (month) => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthNames[month - 1];
    };

    const handleAddAllowance = () => {
        setPayrollForm({
            ...payrollForm,
            allowances: [...payrollForm.allowances, { type: '', amount: 0 }]
        });
    };

    const handleAddDeduction = () => {
        setPayrollForm({
            ...payrollForm,
            deductions: [...payrollForm.deductions, { type: '', amount: 0 }]
        });
    };

    const handleRemoveAllowance = (index) => {
        const updatedAllowances = payrollForm.allowances.filter((_, i) => i !== index);
        setPayrollForm({
            ...payrollForm,
            allowances: updatedAllowances
        });
    };

    const handleRemoveDeduction = (index) => {
        const updatedDeductions = payrollForm.deductions.filter((_, i) => i !== index);
        setPayrollForm({
            ...payrollForm,
            deductions: updatedDeductions
        });
    };

    const handleAllowanceChange = (index, field, value) => {
        const updatedAllowances = [...payrollForm.allowances];
        updatedAllowances[index][field] = field === 'amount' ? Number(value) : value;
        setPayrollForm({
            ...payrollForm,
            allowances: updatedAllowances
        });
    };

    const handleDeductionChange = (index, field, value) => {
        const updatedDeductions = [...payrollForm.deductions];
        updatedDeductions[index][field] = field === 'amount' ? Number(value) : value;
        setPayrollForm({
            ...payrollForm,
            deductions: updatedDeductions
        });
    };

    const handleFormChange = (field, value) => {
        setPayrollForm({
            ...payrollForm,
            [field]: field === 'month' || field === 'year' || field === 'totalWorkingDays' || field === 'basicSalary'
                ? Number(value)
                : value
        });
    };

    return (
        <div className="admin-payroll-dashboard">
            <div className="flex flex-col min-h-screen bg-gray-lightest">
                {/* Navigation Bar */}
                <nav className="bg-gradient-primary text-white p-4 shadow-md">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate('/admin-dashboard')}
                                className="bg-white bg-opacity-80 hover:bg-opacity-100 px-4 py-2 ml-2 rounded-lg text-sm font-medium text-primary transition"
                            >
                                <FiArrowLeft className="mr-2" /> Back
                            </button>
                            <h1 className="text-2xl mr-2 font-bold">Payroll Management</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    Cookies.remove('token');
                                    Cookies.remove('userRole');
                                    navigate('/login');
                                }}
                                className="bg-white bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg text-sm font-medium text-primary transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="flex-1 p-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Payroll Operations</h2>
                            <button
                                onClick={() => {

                                    setShowGenerateModal(true)
                                }
                                }
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <FiPlus className="mr-2" />
                                Generate New Payroll
                            </button>
                        </div>

                        {/* Error and Success Messages */}
                        {/* {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
                                {successMessage}
                            </div>
                        )} */}
                        <p className='p-4'> Generate New Payroll is Premium Featers Upgrade Now </p>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 mb-4">
                                    This dashboard allows you to:
                                </p>
                                <ul className="list-disc pl-5 mb-4 text-gray-700">
                                    <li className="mb-2">Generate payroll for employees</li>
                                    <li className="mb-2">Approve pending payrolls</li>
                                </ul>
                                <p className="text-gray-700">
                                    To generate a payroll, click the "Generate New Payroll" button above.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Generate Payroll Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Generate Payroll {selectedEmployee && `- ${selectedEmployee.name}`}
                            </h3>
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
                                    {successMessage}
                                </div>
                            )}

                            {/* Basic Information */}
                            <div className="mb-6">
                                <h4 className="text-lg font-medium mb-4">Basic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedEmployee?._id || ''}
                                            onChange={(e) => {
                                                const employee = employees.find(emp => emp._id === e.target.value);
                                                setSelectedEmployee(employee);
                                            }}
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={payrollForm.basicSalary}
                                            onChange={(e) => handleFormChange('basicSalary', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={payrollForm.month}
                                            onChange={(e) => handleFormChange('month', e.target.value)}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <option key={month} value={month}>{getMonthName(month)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={payrollForm.year}
                                            onChange={(e) => handleFormChange('year', e.target.value)}
                                        >
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={payrollForm.totalWorkingDays}
                                            onChange={(e) => handleFormChange('totalWorkingDays', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Allowances */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-medium">Allowances</h4>
                                    <button
                                        onClick={handleAddAllowance}
                                        className="text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        <FiPlus className="mr-1" /> Add Allowance
                                    </button>
                                </div>
                                {payrollForm.allowances.map((allowance, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <div className="flex-1 mr-2">
                                            <input
                                                type="text"
                                                placeholder="Type"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={allowance.type}
                                                onChange={(e) => handleAllowanceChange(index, 'type', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1 mr-2">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={allowance.amount}
                                                onChange={(e) => handleAllowanceChange(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAllowance(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Deductions */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-medium">Deductions</h4>
                                    <button
                                        onClick={handleAddDeduction}
                                        className="text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        <FiPlus className="mr-1" /> Add Deduction
                                    </button>
                                </div>
                                {payrollForm.deductions.map((deduction, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <div className="flex-1 mr-2">
                                            <input
                                                type="text"
                                                placeholder="Type"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={deduction.type}
                                                onChange={(e) => handleDeductionChange(index, 'type', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1 mr-2">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={deduction.amount}
                                                onChange={(e) => handleDeductionChange(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDeduction(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium mb-2">Summary</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm">
                                        <span className="text-gray-600">Basic Salary:</span>
                                        <span className="float-right font-medium">{formatCurrency(payrollForm.basicSalary)}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Total Allowances:</span>
                                        <span className="float-right font-medium">
                                            {formatCurrency(payrollForm.allowances.reduce((sum, item) => sum + item.amount, 0))}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Total Deductions:</span>
                                        <span className="float-right font-medium">
                                            {formatCurrency(payrollForm.deductions.reduce((sum, item) => sum + item.amount, 0))}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Gross Salary:</span>
                                        <span className="float-right font-medium">
                                            {formatCurrency(payrollForm.basicSalary +
                                                payrollForm.allowances.reduce((sum, item) => sum + item.amount, 0))}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                    <div className="text-base font-semibold flex justify-between">
                                        <span>Estimated Net Salary:</span>
                                        <span className="text-blue-700">
                                            {formatCurrency(
                                                payrollForm.basicSalary +
                                                payrollForm.allowances.reduce((sum, item) => sum + item.amount, 0) -
                                                payrollForm.deductions.reduce((sum, item) => sum + item.amount, 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowGenerateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGeneratePayroll}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                    disabled={isLoading || !selectedEmployee}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FiDollarSign className="mr-2" />
                                            Generate Payroll
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayrollDashboard; 