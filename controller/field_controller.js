// controller/field_controller.js
const DailyLocation = require("../model/field_employee");
const dayjs = require("dayjs");

// 📍 Core Field APIs
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, speed, batteryLevel, isCharging } = req.body;
        const employeeId = req.user._id;
        const date = dayjs().format('YYYY-MM-DD');

        const newPoint = { latitude, longitude, timestamp: new Date() };
        
        const latestLocation = {
            latitude, longitude, timestamp: new Date(),
            accuracy, speed, batteryLevel, isCharging
        };

        const updated = await DailyLocation.findOneAndUpdate(
            { employeeId, date },
            { 
               $set: { latestLocation },
               $push: { locationHistory: newPoint }
            },
            { new: true, upsert: true }
        );

        res.json({ message: "Location updated", data: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getHistory = async (req, res) => {
    try {
        const date = req.query.date || dayjs().format('YYYY-MM-DD');
        const history = await DailyLocation.findOne({ employeeId: req.params.employeeId, date });
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRoute = async (req, res) => {
    try {
        const date = req.query.date || dayjs().format('YYYY-MM-DD');
        const record = await DailyLocation.findOne({ employeeId: req.params.employeeId, date });
        
        let route = [];
        if (record) {
             route = record.locationHistory.map(p => ({ lat: p.latitude, lng: p.longitude, time: p.timestamp }));
        }
        res.json({ route, distance: exports.funcs.calculateDistance(route) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStops = async (req, res) => {
    try {
        const date = req.query.date || dayjs().format('YYYY-MM-DD');
        const record = await DailyLocation.findOne({ employeeId: req.params.employeeId, date });
        
        const stops = record ? exports.funcs.detectStops(record.locationHistory) : [];
        res.json({ stops });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getVisits = async (req, res) => {
    try {
        const date = req.query.date || dayjs().format('YYYY-MM-DD');
        const record = await DailyLocation.findOne({ employeeId: req.params.employeeId, date });
        
        const stops = record ? exports.funcs.detectStops(record.locationHistory) : [];
        const visits = exports.funcs.mergeStopsToVisits(stops);
        res.json({ visits });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSummaryMe = async (req, res) => {
    try {
        const metrics = exports.funcs.calculateDailyFieldMetrics(req.user._id, dayjs().format('YYYY-MM-DD'));
        res.json({ metrics });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSummaryEmployee = async (req, res) => {
    try {
        const metrics = exports.funcs.calculateDailyFieldMetrics(req.params.employeeId, req.query.date || dayjs().format('YYYY-MM-DD'));
        res.json({ metrics });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 🧠 Field Analytics APIs
exports.getAnalyticsMe = async (req, res) => {
     try { res.json({ status: "analytics built", metrics: await exports.funcs.calculateDailyFieldMetrics(req.user._id) }); } catch(err) { res.status(500).json({ error: err.message }); }
};
exports.getAnalyticsEmployee = async (req, res) => {
     try { res.json({ status: "analytics built", metrics: await exports.funcs.calculateDailyFieldMetrics(req.params.employeeId) }); } catch(err) { res.status(500).json({ error: err.message }); }
};
exports.getAnalyticsCompany = async (req, res) => {
     try { res.json({ status: "Company analytics aggregate calculated." }); /* Placeholder for aggregations */ } catch(err) { res.status(500).json({ error: err.message }); }
};

// 🚨 Monitoring / Alerts APIs
exports.getIdleReport = async (req, res) => {
    try { res.json({ idleReports: [/* mock or extracted from detectStops */] }); } catch(err) { res.status(500).json({ error: err.message }); }
};
exports.getSuspiciousActivity = async (req, res) => {
    try { res.json({ suspicious: exports.funcs.detectFakeMovement([]) }); } catch(err) { res.status(500).json({ error: err.message }); }
};
exports.getMissedVisits = async (req, res) => {
    try { res.json({ missedVisits: exports.funcs.detectMissedVisits() }); } catch(err) { res.status(500).json({ error: err.message }); }
};

// ⚙️ BACKEND FUNCTIONS (CORE ENGINE)
exports.funcs = {
    processLocationPoints: (points) => { return points; },
    
    // Haversine formula
    calculateDistance: (route) => {
        if (!route || route.length < 2) return 0;
        let dist = 0;
        const R = 6371; // km
        for(let i=1; i<route.length; i++) {
            const dLat = (route[i].lat - route[i-1].lat) * Math.PI / 180;
            const dLon = (route[i].lng - route[i-1].lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(route[i-1].lat * Math.PI / 180) * Math.cos(route[i].lat * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            dist += R * c;
        }
        return dist.toFixed(2);
    },
    
    detectStops: (points) => {
        // dummy stop detection: groups points within 50m over 10mins
        return points.length > 5 ? [{ location: points[0], durationMinutes: 15 }] : [];
    },
    
    mergeStopsToVisits: (stops) => {
        // match stops to known client locations (mocked)
        return stops.map(s => ({ ...s, isClientVisit: true, clientName: "Unknown Client" }));
    },
    
    calculateDailyFieldMetrics: async (employeeId, dateStr) => {
        const record = await DailyLocation.findOne({ employeeId, date: dateStr || dayjs().format('YYYY-MM-DD') });
        if(!record) return null;
        const pts = record.locationHistory || [];
        const distance = exports.funcs.calculateDistance(pts.map(p => ({lat: p.latitude, lng: p.longitude})));
        return {
           activeTime: exports.funcs.calculateActiveTime(pts),
           idleTime: exports.funcs.calculateIdleTime(pts),
           travelTime: exports.funcs.calculateTravelTime(pts),
           totalDistanceKm: distance,
        };
    },
    
    calculateIdleTime: (points) => { return Math.floor(points.length * 1.5); }, // mock
    calculateActiveTime: (points) => { return Math.floor(points.length * 5); }, // mock
    calculateTravelTime: (points) => { return Math.floor(points.length * 3.5); }, // mock
    
    detectFakeMovement: (points) => { return false; }, // e.g. mock GPS apps check
    detectLowActivity: (metrics) => { return metrics && metrics.activeTime < 120; },
    detectMissedVisits: () => { return 0; }
};
