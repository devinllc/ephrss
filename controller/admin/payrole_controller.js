const PDFDocument = require("pdfkit");

const Attendance = require("../../model/attendence_model");
const Leave = require("../../model/leave_model");
const Payroll = require("../../model/payrole_model");

// ... (existing code: generatePayroll, approvePayroll, getAllPayrolls) ...

module.exports.downloadPayslipPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await Payroll.findById(id).populate('employee');

        if (!payroll) {
            return res.status(404).json({ message: "Payroll record not found" });
        }

        const doc = new PDFDocument({ margin: 50 });
        let filename = `payslip_${payroll.employee.name}_${payroll.month}_${payroll.year}.pdf`;
        
        // Sanitize filename
        filename = encodeURIComponent(filename);

        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        // Header
        doc.fontSize(20).text('EMPOWER HR - PAYSLIP', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Month/Year: ${payroll.month}/${payroll.year}`, { align: 'right' });
        doc.moveDown();

        // Employee Details
        doc.text('Employee Details:', { underline: true });
        doc.text(`Name: ${payroll.employee.name}`);
        doc.text(`Email: ${payroll.employee.email}`);
        doc.text(`Salary: ${payroll.basicSalary}`);
        doc.moveDown();

        // Table Header
        const startX = 50;
        const col1 = 50;
        const col2 = 350;

        doc.text('Description', col1, doc.y, { width: 300 });
        doc.text('Amount', col2, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(startX, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Earnings
        doc.text('Basic Salary (Adjusted for Attendance)', col1);
        doc.text(payroll.grossSalary.toFixed(2), col2, doc.y, { align: 'right' });
        doc.moveDown();

        payroll.allowances.forEach(allowance => {
            doc.text(`Allowance: ${allowance.type}`, col1);
            doc.text(allowance.amount.toFixed(2), col2, doc.y, { align: 'right' });
            doc.moveDown();
        });

        doc.moveTo(startX, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Deductions
        doc.fillColor('red').text('Deductions:', col1, doc.y, { underline: true });
        doc.moveDown();

        payroll.deductions.forEach(deduction => {
            doc.text(deduction.type || "Deduction", col1);
            doc.text(deduction.amount.toFixed(2), col2, doc.y, { align: 'right' });
            doc.moveDown();
        });

        doc.moveTo(startX, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Total
        doc.fillColor('black').fontSize(14).text('Net Salary:', col1);
        doc.text(`INR ${payroll.netSalary.toFixed(2)}`, col2, doc.y, { align: 'right' });

        doc.end();
        doc.pipe(res);

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Error generating payslip PDF" });
    }
};

module.exports.generatePayroll = async (req, res) => {
    try {
        let {
            employeeId,
            month,
            year,
            totalWorkingDays,
            basicSalary,
            allowances = [],
            deductions = []
        } = req.body;

        // Validation: Make sure basicSalary and totalWorkingDays are numbers
        if (!basicSalary || isNaN(basicSalary)) {
            return res.status(400).json({ message: "Invalid or missing basicSalary" });
        }

        if (!totalWorkingDays || isNaN(totalWorkingDays)) {
            return res.status(400).json({ message: "Invalid or missing totalWorkingDays" });
        }

        // If allowances/deductions are empty strings, fix them
        if (typeof allowances === 'string') {
            allowances = [];
        }
        if (typeof deductions === 'string') {
            deductions = [];
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendances = await Attendance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ["present", "half-day"] }
        });

        const leaves = await Leave.find({
            employee: employeeId,
            fromDate: { $lte: endDate },
            toDate: { $gte: startDate },
            status: "approved"
        });

        const daysPresent = attendances.length;
        const daysLeaveApproved = leaves.reduce((total, leave) => {
            const from = new Date(Math.max(new Date(leave.fromDate), startDate));
            const to = new Date(Math.min(new Date(leave.toDate), endDate));
            const days = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
        }, 0);

        const paidDays = daysPresent + daysLeaveApproved;
        const perDaySalary = basicSalary / totalWorkingDays;
        const adjustedBasicSalary = perDaySalary * paidDays;

        // Add standard deduction logic (Tax, PF)
        const professionalTax = adjustedBasicSalary > 10000 ? 200 : 0;
        const providendFund = adjustedBasicSalary * 0.12; // 12% PF
        
        const totalAllowances = allowances.reduce((sum, item) => sum + (item.amount || 0), 0);
        
        // Combine manual deductions with calculated ones
        const calculatedDeductions = [
          ...deductions,
          { type: "Professional Tax", amount: professionalTax },
          { type: "PF (Employee Share)", amount: providendFund }
        ];

        const totalDeductions = calculatedDeductions.reduce((sum, item) => sum + (item.amount || 0), 0);

        const grossSalary = adjustedBasicSalary + totalAllowances;
        const netSalary = grossSalary - totalDeductions;

        const payroll = new Payroll({
            employee: employeeId,
            month,
            year,
            totalWorkingDays,
            daysPresent,
            daysLeaveApproved,
            basicSalary,
            allowances,
            deductions: calculatedDeductions,
            grossSalary,
            totalDeductions,
            netSalary
        });

        await payroll.save();

        res.status(201).json({ message: "Payroll generated successfully", payroll });

    } catch (error) {
        console.error("Payroll generation error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports.approvePayroll = async (req, res) => {
    try {
        const { payrollId } = req.body;
        const adminId = req.user._id; // assuming admin user is authenticated

        const payroll = await Payroll.findById(payrollId);

        if (!payroll) {
            return res.status(404).json({ message: "Payroll not found" });
        }

        if (payroll.status === "approved") {
            return res.status(400).json({ message: "Payroll already approved" });
        }

        payroll.status = "approved";
        payroll.approvedBy = adminId;
        payroll.paymentDate = new Date();

        await payroll.save();

        res.status(200).json({ message: "Payroll approved successfully", payroll });
    } catch (error) {
        console.error("Payroll approval error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


exports.getAllPayrolls = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            month,
            year,
            employeeId,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const query = {};

        // Filters
        if (status) query.status = status;
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (employeeId) query.employee = employeeId;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
            populate: {
                path: "employee approvedBy",
                select: "name email role"
            }
        };

        const payrolls = await Payroll.paginate ?
            await Payroll.paginate(query, options) :
            await Payroll.find(query)
                .populate(options.populate)
                .sort(options.sort)
                .skip((options.page - 1) * options.limit)
                .limit(options.limit);

        const total = await Payroll.countDocuments(query);

        res.status(200).json({
            success: true,
            data: payrolls,
            total,
            page: options.page,
            totalPages: Math.ceil(total / options.limit)
        });
    } catch (error) {
        console.error("Error fetching payrolls:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
