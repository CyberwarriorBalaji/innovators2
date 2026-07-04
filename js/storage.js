/**
 * Innovators 2.0 - LocalStorage Database Engine
 * Handles full CRUD operations for Employees, Workers, Sessions, and System Logs.
 */

const STORAGE_KEYS = {
    USERS: 'innovators_users',
    CURRENT_SESSION: 'innovators_session',
    SYSTEM_LOGS: 'innovators_logs',
    ANNOUNCEMENTS: 'innovators_announcements'
};

// Seed initial system data if empty
function initializeDatabase() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = [
            {
                id: "EMP-2026-0001",
                name: "Sarah Jenkins",
                email: "sarah.j@innovators.com",
                role: "employee",
                password: "Password123!",
                phone: "+15550192",
                department: "Engineering",
                designation: "Senior UI/UX Engineer",
                status: "Active",
                attendance: 96,
                salary: 115000,
                leaves: 3,
                performance: 94,
                experience: "5 Years",
                joiningDate: "2023-04-12",
                skills: ["Figma", "CSS3", "Vanilla JS", "WebGL"],
                avatar: ""
            },
            {
                id: "WRK-2026-0002",
                name: "Marcus Vance",
                email: "marcus.v@innovators.com",
                role: "worker",
                password: "Worker123!",
                phone: "+15558831",
                department: "Facilities",
                designation: "Logistics Specialist",
                status: "Active",
                attendance: 92,
                salary: 48000,
                leaves: 5,
                performance: 88,
                experience: "2 Years",
                joiningDate: "2024-09-01",
                skills: ["Inventory Control", "Safety Operations"],
                avatar: ""
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
        const defaultAnnouncements = [
            { id: 1, title: "Q3 Strategy Meeting", content: "All-hands briefing scheduled for Monday at 10 AM EST.", date: "2026-07-05" },
            { id: 2, title: "System Maintenence", content: "Portal optimization will happen overnight on Saturday.", date: "2026-07-04" }
        ];
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultAnnouncements));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS)) {
        localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify([
            { timestamp: new Date().toISOString(), user: "System", action: "Database Initialized" }
        ]));
    }
}

// Global Core Utilities
const DB = {
    getUsers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [],
    saveUsers: (users) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),
    getSession: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)) || null,
    setSession: (user) => localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user)),
    clearSession: () => localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION),
    getLogs: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS)) || [],
    addLog: (user, action) => {
        const logs = DB.getLogs();
        logs.unshift({ timestamp: new Date().toLocaleString(), user, action });
        localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(logs.slice(0, 100))); // Limit to last 100 logs
    },
    getAnnouncements: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) || [],
    addAnnouncement: (title, content) => {
        const list = DB.getAnnouncements();
        list.unshift({ id: Date.now(), title, content, date: new Date().toISOString().split('T')[0] });
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    }
};

// Initialize instantly upon load
initializeDatabase();
