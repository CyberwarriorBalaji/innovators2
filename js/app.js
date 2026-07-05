/**
 * ==========================================================================
 * INNOVATORS 2.O - CENTRAL ROUTER SECURITY MATRIX ENGINE WITH LIVE FIRE MATRIX
 * ==========================================================================
 */

(function () {
    'use strict';

    const DB_CONFIG = {
        KEYS: { USERS_REGISTRY: 'inn2_users_registry_x', SESSION_NODE: 'inn2_session_node_x', SYSTEM_DISPATCH: 'inn2_dispatch_feed_x' },
        ROOT_ADMIN: {
            empId: "INV-0001", name: "Balaji", email: "balaji@innovators.com", password: "Balaji12@12", role: "Admin",
            designation: "Head Chief Operations Architect", department: "Root Operations Control", mobile: "+1-800-INNOVATORS",
            personalEmail: "balaji@innovators.com", location: "Head Office Command Hub", bloodGroup: "A+", panNumber: "INNVB7777K",
            pfNumber: "PF777111222", bankName: "Imperial Vault Bank", bankAccount: "XXXX1212", emergencyContact: "Security Core",
            bio: "Central control console root authority node initialization module.", cvText: "Enterprise scale architectural director.",
            github: "", linkedin: "", certificate: "", leaves: { casual: 99, sick: 99, earned: 99 }
        }
    };

    function enforceRegistrySanityCheck() {
        if (!localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) {
            const seedCoreDataset = [
                DB_CONFIG.ROOT_ADMIN,
                {
                    empId: "INV-4021", name: "Arun Kumar S", email: "worker", password: "worker", role: "Worker",
                    designation: "Software Engineer", department: "Full Stack Core", mobile: "+91 9876543210",
                    personalEmail: "arunkumar@gmail.com", location: "Chennai, Tamil Nadu", bloodGroup: "B+",
                    panNumber: "ABCPK1234D", pfNumber: "PF123456789", bankName: "State Bank of India", bankAccount: "XXXX4567",
                    emergencyContact: "Suresh Kumar (Father) - +91 9876543200", bio: "Passionate developer focused on building interactive web interfaces.",
                    cvText: "Experience: Fresher | Skills: Java, JavaScript, React, Node.js",
                    github: "https://github.com", linkedin: "https://linkedin.com", certificate: "", leaves: { casual: 12, sick: 10, earned: 15 }
                }
            ];
            localStorage.setItem(DB_CONFIG.KEYS.USERS_REGISTRY, JSON.stringify(seedCoreDataset));
        }
        if (!localStorage.getItem(DB_CONFIG.KEYS.SYSTEM_DISPATCH)) {
            localStorage.setItem(DB_CONFIG.KEYS.SYSTEM_DISPATCH, JSON.stringify({ target: "ALL", msg: "Innovators 2.o Operational Node Active. Monitoring logs." }));
        }
    }

    function createNotificationToast(text, variant = 'success') {
        const stage = document.getElementById('toast-container');
        if (!stage) return;
        const slice = document.createElement('div');
        slice.className = `toast-msg ${variant === 'error' ? 'error' : ''}`;
        slice.innerText = text;
        stage.appendChild(slice);
        setTimeout(() => slice.remove(), 3500);
    }

    document.addEventListener('DOMContentLoaded', () => {
        enforceRegistrySanityCheck();

        if (document.getElementById('login-form')) {
            runFireCanvasSimulation();
            setupLoginComponentDrivers();
        } else if (document.getElementById('dashboard-content-frame')) {
            const sessionData = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.SESSION_NODE));
            if (!sessionData) {
                window.location.href = 'index.html';
                return;
            }
            setupWorkspaceMasterDrivers(sessionData);
        }
    });

    // ==================== FIRE PARTICLE ENGINE MATRIX ====================
    function runFireCanvasSimulation() {
        const canvas = document.getElementById('login-fire-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        const particles = [];
        class FireParticle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + Math.random() * 200;
                this.speedY = Math.random() * 3 + 1;
                this.radius = Math.random() * 40 + 10;
                this.opacity = 1;
                this.colorValue = Math.random(); 
            }
            update() {
                this.y -= this.speedY;
                this.radius *= 0.98;
                this.opacity -= 0.006;
                if (this.x > canvas.width || this.radius < 1 || this.opacity <= 0) {
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + Math.random() * 50;
                    this.speedY = Math.random() * 3 + 1;
                    this.radius = Math.random() * 40 + 10;
                    this.opacity = 1;
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                let r = 239, g = 115, b = 22; // Orange
                if (this.colorValue > 0.6) { r = 239; g = 68; b = 68; } // Red
                else if (this.colorValue < 0.2) { r = 245; g = 158; b = 11; } // Yellow
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.25})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < 70; i++) {
            particles.push(new FireParticle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    function setupLoginComponentDrivers() {
        const formLogin = document.getElementById('login-form');
        const formRegister = document.getElementById('register-form');
        const btnGoogle = document.getElementById('btn-google-login');
        const googlePortal = document.getElementById('google-modal-portal');
        const googleSsoForm = document.getElementById('google-sso-dynamic-form');
        
        const loginPanel = document.getElementById('login-panel');
        const registerPanel = document.getElementById('register-panel');

        // FIXED VIEW SWITCHERS
        document.getElementById('go-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            loginPanel.classList.add('hidden');
            registerPanel.classList.remove('hidden');
        });

        document.getElementById('go-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            registerPanel.classList.add('hidden');
            loginPanel.classList.remove('hidden');
        });

        // MANUAL AUTH
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputUser = document.getElementById('login-email').value.trim();
            const inputPass = document.getElementById('login-password').value;

            const database = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) || [];
            const match = database.find(u => (u.email.toLowerCase() === inputUser.toLowerCase() || u.name.toLowerCase() === inputUser.toLowerCase()) && u.password === inputPass);

            if (match) {
                localStorage.setItem(DB_CONFIG.KEYS.SESSION_NODE, JSON.stringify(match));
                window.location.href = 'dashboard.html';
            } else {
                createNotificationToast('Verification failed. Check credentials.', 'error');
            }
        });

        // MANUAL MANIFEST REGISTER
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value.trim().toLowerCase();
            const password = document.getElementById('reg-password').value;
            const department = document.getElementById('reg-dept').value;

            const database = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) || [];
            
            if (database.some(u => u.email === email)) {
                createNotificationToast('This email registration endpoint already exists.', 'error');
                return;
            }

            const newWorker = {
                empId: 'INV-' + Math.floor(1000 + Math.random() * 9000),
                name: name, email: email, password: password, role: "Worker",
                designation: "Associate Member", department: department, mobile: "+91 ",
                personalEmail: "", location: "Field Office Hub", bloodGroup: "O+", panNumber: "",
                pfNumber: 'PF' + Math.floor(1000000 + Math.random() * 9000000),
                bankName: "", bankAccount: "", emergencyContact: "", bio: "", cvText: "",
                github: "", linkedin: "", certificate: "", leaves: { casual: 12, sick: 10, earned: 15 }
            };

            database.push(newWorker);
            localStorage.setItem(DB_CONFIG.KEYS.USERS_REGISTRY, JSON.stringify(database));
            createNotificationToast('Registration matrix completed! Access permitted.');
            
            formRegister.reset();
            registerPanel.classList.add('hidden');
            loginPanel.classList.remove('hidden');
        });

        // DYNAMIC GOOGLE WORKSPACE BYPASS ROUTER ENGINE
        btnGoogle.addEventListener('click', () => googlePortal.classList.remove('hidden'));
        document.getElementById('close-google-modal').addEventListener('click', () => googlePortal.classList.add('hidden'));

        googleSsoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const chosenEmail = document.getElementById('google-sso-email').value.trim().toLowerCase();
            let database = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) || [];

            // Directly intercept if user requests Head access via email
            if (chosenEmail === 'balaji@innovators.com') {
                const headNode = database.find(u => u.email === 'balaji@innovators.com') || DB_CONFIG.ROOT_ADMIN;
                localStorage.setItem(DB_CONFIG.KEYS.SESSION_NODE, JSON.stringify(headNode));
                window.location.href = 'dashboard.html';
                return;
            }

            // Otherwise, see if email exists or auto register on the fly
            let existingUser = database.find(u => u.email === chosenEmail);
            if (!existingUser) {
                const autoName = chosenEmail.split('@')[0].toUpperCase();
                existingUser = {
                    empId: 'INV-' + Math.floor(1000 + Math.random() * 9000),
                    name: autoName, email: chosenEmail, password: "GoogleLinkedSSO1", role: "Worker",
                    designation: "Google Verified Worker", department: "Google Cloud Node", mobile: "+91 System Linked",
                    personalEmail: chosenEmail, location: "Remote Core", bloodGroup: "O+", panNumber: "",
                    pfNumber: 'PF' + Math.floor(1000000 + Math.random() * 9000000),
                    bankName: "", bankAccount: "", emergencyContact: "", bio: "Profile generated dynamically via Google Cloud Workspace link.",
                    cvText: "", github: "", linkedin: "", certificate: "", leaves: { casual: 12, sick: 10, earned: 15 }
                };
                database.push(existingUser);
                localStorage.setItem(DB_CONFIG.KEYS.USERS_REGISTRY, JSON.stringify(database));
            }

            localStorage.setItem(DB_CONFIG.KEYS.SESSION_NODE, JSON.stringify(existingUser));
            window.location.href = 'dashboard.html';
        });
    }

    function setupWorkspaceMasterDrivers(activeSession) {
        document.getElementById('sb-user-name').innerText = activeSession.name;
        document.getElementById('sb-user-role').innerText = activeSession.designation || activeSession.role;
        document.getElementById('sb-user-avatar').innerText = activeSession.name.charAt(0);

        const feed = document.getElementById('system-dispatch-feed');
        function evalLiveBroadcastFeed() {
            const liveMsgData = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.SYSTEM_DISPATCH));
            if (liveMsgData && (liveMsgData.target === 'ALL' || liveMsgData.target === activeSession.role)) {
                feed.innerHTML = `<span><strong>[BROADCAST PAYLOAD ALERT]</strong> ${liveMsgData.msg}</span>`;
                feed.classList.remove('hidden');
            } else {
                feed.classList.add('hidden');
            }
        }
        evalLiveBroadcastFeed();

        const sideNavContainer = document.getElementById('sidebar-menu-items');

        function routeSubViewDisplayFrame(viewKey) {
            const frameViewport = document.getElementById('dashboard-content-frame');
            sideNavContainer.querySelectorAll('.nav-item-link').forEach(n => n.classList.remove('active'));
            const matchedLink = sideNavContainer.querySelector(`[data-frameview="${viewKey}"]`);
            if (matchedLink) matchedLink.classList.add('active');

            if (viewKey === 'home') {
                if (activeSession.role === 'Admin') {
                    frameViewport.innerHTML = document.getElementById('view-admin-home').innerHTML;
                    executeAdministrativeControls(evalLiveBroadcastFeed);
                } else {
                    frameViewport.innerHTML = `
                        <div class="view-padding animate-fade-in">
                            <div class="welcome-banner-hero" style="background: linear-gradient(135deg, #7C2D12, #451A03); border: 1px solid var(--gold-accent);">
                                <h1>Innovators 2.o Operational Portfolio Desk • Node ${activeSession.empId}</h1>
                                <p>Welcome back, worker teammate ${activeSession.name}. Review your linked bio-data parameters, check leaves, or patch your CV data parameters.</p>
                            </div>
                            <div class="grid-form">
                                <div class="glass-card">
                                    <h4 class="gold-text">📊 Balance Leave Pools</h4>
                                    <p style="margin-top:0.75rem;">Casual Allocation: <strong>${activeSession.leaves?.casual || 0} Remaining Days</strong></p>
                                    <p>Sick Leave Allocation: <strong>${activeSession.leaves?.sick || 0} Days Available</strong></p>
                                    <p>Earned Units: <strong>${activeSession.leaves?.earned || 0} Operational Units</strong></p>
                                </div>
                                <div class="glass-card">
                                    <h4 style="color:#F97316;">🔒 Compliance Records State</h4>
                                    <p style="margin-top:0.75rem;">PAN Card Verification Hash: <code>${activeSession.panNumber || 'Unassigned'}</code></p>
                                    <p>PF Tracking String: <code>${activeSession.pfNumber || 'Unassigned'}</code></p>
                                    <p>Clearing Bank Channel: <strong>${activeSession.bankName || 'Not Linked'}</strong></p>
                                </div>
                            </div>
                        </div>`;
                }
                document.getElementById('current-page-title').innerText = `${activeSession.role} Control Overview`;
            } else if (viewKey === 'profile') {
                frameViewport.innerHTML = document.getElementById('view-profile').innerHTML;
                executeProfileWorkspaceInteractions(activeSession);
            }
        }

        sideNavContainer.addEventListener('click', (e) => {
            const linkNode = e.target.closest('.nav-item-link');
            if (!linkNode) return;
            e.preventDefault();
            routeSubViewDisplayFrame(linkNode.dataset.frameview);
        });

        routeSubViewDisplayFrame('home');
        setInterval(() => {
            const timer = document.getElementById('portal-live-clock');
            if (timer) timer.innerText = new Date().toLocaleTimeString();
        }, 1000);

        document.getElementById('sidebar-btn-logout').addEventListener('click', () => {
            localStorage.removeItem(DB_CONFIG.KEYS.SESSION_NODE);
            window.location.href = 'index.html';
        });
    }

    function executeAdministrativeControls(refreshBroadcastHook) {
        const injector = document.getElementById('admin-table-body-injector');
        const queryInput = document.getElementById('admin-search-input');
        const ingestForm = document.getElementById('admin-add-user-form');

        function drawAdministrativeRegistryLedgerTable() {
            const coreCurrentRegistry = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) || [];
            let filterQueryText = queryInput.value.toLowerCase();
            injector.innerHTML = '';

            let processedDataSet = coreCurrentRegistry.filter(row => 
                row.name.toLowerCase().includes(filterQueryText) || 
                row.empId.toLowerCase().includes(filterQueryText) ||
                (row.bloodGroup && row.bloodGroup.toLowerCase().includes(filterQueryText)) ||
                (row.department && row.department.toLowerCase().includes(filterQueryText))
            );

            processedDataSet.forEach(row => {
                const tr = document.createElement('tr');
                let renderImage = row.certificate ? `<img src="${row.certificate}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--gold-accent);">` : `<div style="width:40px; height:40px; border-radius:50%; background:var(--primary-color); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem;">${row.name.charAt(0)}</div>`;
                
                let resumeFlag = row.cvText ? `<span class="status-pill" style="background:rgba(40,167,69,0.15); color:#28A745;">CV Saved</span>` : `<span class="status-pill" style="background:rgba(220,53,69,0.15); color:#DC3545;">No Text CV</span>`;

                tr.innerHTML = `
                    <td>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            ${renderImage}
                            <div><b style="color:var(--gold-accent); font-family:monospace; font-size:0.85rem;">${row.empId}</b><br><small class="status-pill" style="font-size:0.7rem;">${row.role}</small></div>
                        </div>
                    </td>
                    <td>
                        <strong>${row.name}</strong><br>
                        <small style="color:var(--text-secondary); font-size:0.75rem;">${row.designation || 'Staff'} • ${row.department || 'Pool'}</small>
                        <p style="font-size:0.75rem; color:#A0AEC0; margin-top:0.25rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><b>Bio Summary:</b> ${row.bio || 'None'}</p>
                    </td>
                    <td>
                        <small style="display:block; font-size:0.75rem;"><b>PAN Code:</b> ${row.panNumber || 'N/A'}</small>
                        <small style="display:block; font-size:0.75rem;"><b>PF Reg:</b> ${row.pfNumber || 'N/A'}</small>
                        <small style="display:block; font-size:0.75rem; color:var(--gold-accent);"><b>Blood Group:</b> ${row.bloodGroup || 'Unspecified'}</small>
                    </td>
                    <td>
                        <span style="font-size:0.75rem; display:block;">Casual: ${row.leaves?.casual || 0}</span>
                        <span style="font-size:0.75rem; display:block;">Sick: ${row.leaves?.sick || 0}</span>
                    </td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:0.2rem; align-items:flex-start;">
                            ${resumeFlag}
                            ${row.github ? `<span class="status-pill" style="color:#FFF; background:#334155;">Repo Link Linked</span>` : ''}
                        </div>
                    </td>
                    <td><button class="secondary-btn cmd-purge-trigger" data-empid="${row.empId}" style="color:#FF4D5E; padding: 0.15rem 0.35rem; font-size:0.7rem;">Purge</button></td>
                `;
                injector.appendChild(tr);
            });
        }

        document.getElementById('btn-adm-dispatch-send').addEventListener('click', () => {
            const msg = document.getElementById('adm-dispatch-msg').value;
            const target = document.getElementById('adm-dispatch-target').value;
            if(!msg) return;
            localStorage.setItem(DB_CONFIG.KEYS.SYSTEM_DISPATCH, JSON.stringify({ target, msg }));
            createNotificationToast('Global broadcast state synchronized successfully.');
            refreshBroadcastHook();
        });

        ingestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const roleSelection = document.getElementById('adm-reg-role').value;
            const newElement = {
                empId: 'INV-' + Math.floor(1000 + Math.random() * 9000),
                name: document.getElementById('adm-reg-name').value,
                email: document.getElementById('adm-reg-email').value.trim(),
                password: document.getElementById('adm-reg-password').value,
                role: roleSelection,
                designation: document.getElementById('adm-reg-designation').value || 'Associate Expert',
                department: document.getElementById('adm-reg-dept').value || 'Operations Team',
                mobile: '+91 9999988888', personalEmail: '', location: 'Main Hub',
                bloodGroup: document.getElementById('adm-reg-blood').value || 'O+',
                panNumber: document.getElementById('adm-reg-pan').value || 'UNPROVIDED',
                pfNumber: 'PF' + Math.floor(1000000 + Math.random() * 9000000),
                bankName: 'Clearing Bank House', bankAccount: 'XXXX0000', emergencyContact: '',
                bio: '', cvText: '', github: '', linkedin: '', certificate: '', leaves: { casual: 12, sick: 10, earned: 15 }
            };

            const database = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) || [];
            database.push(newElement);
            localStorage.setItem(DB_CONFIG.KEYS.USERS_REGISTRY, JSON.stringify(database));
            ingestForm.reset();
            drawAdministrativeRegistryLedgerTable();
            createNotificationToast('New structural worker generated inside archive index log.');
        });

        injector.addEventListener('click', (e) => {
            if (e.target.classList.contains('cmd-purge-trigger')) {
                const targetedId = e.target.dataset.empid;
                if (targetedId === 'INV-0001') return createNotificationToast('Protected administrative node structural record.', 'error');
                let data = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY)) || [];
                data = data.filter(u => u.empId !== targetedId);
                localStorage.setItem(DB_CONFIG.KEYS.USERS_REGISTRY, JSON.stringify(data));
                drawAdministrativeRegistryLedgerTable();
            }
        });

        queryInput.addEventListener('input', drawAdministrativeRegistryLedgerTable);
        drawAdministrativeRegistryLedgerTable();
    }

    function executeProfileWorkspaceInteractions(sessionNode) {
        document.getElementById('profile-display-fullname').innerText = sessionNode.name;
        document.getElementById('profile-display-role').innerText = `${sessionNode.role} Registry Node Control Space`;
        document.getElementById('profile-display-meta-title').innerText = `ID Code Matrix Hash: ${sessionNode.empId} | Corporate Department: ${sessionNode.department || 'Pool'}`;
        
        document.getElementById('prof-name').value = sessionNode.name;
        document.getElementById('prof-designation').value = sessionNode.designation || '';
        document.getElementById('prof-dept').value = sessionNode.department || '';
        document.getElementById('prof-location').value = sessionNode.location || '';
        document.getElementById('prof-mobile').value = sessionNode.mobile || '';
        document.getElementById('prof-personal-email').value = sessionNode.personalEmail || '';
        document.getElementById('prof-blood').value = sessionNode.bloodGroup || '';
        document.getElementById('prof-emergency').value = sessionNode.emergencyContact || '';
        document.getElementById('prof-bio').value = sessionNode.bio || '';
        document.getElementById('prof-cv-text').value = sessionNode.cvText || '';
        document.getElementById('prof-github').value = sessionNode.github || '';
        document.getElementById('prof-linkedin').value = sessionNode.linkedin || '';
        document.getElementById('prof-pan').value = sessionNode.panNumber || '';
        document.getElementById('prof-pf').value = sessionNode.pfNumber || '';
        document.getElementById('prof-bank-name').value = sessionNode.bankName || '';
        document.getElementById('prof-bank-acc').value = sessionNode.bankAccount || '';

        const previewContainer = document.getElementById('prof-cert-image-viewport');
        let base64BufferString = sessionNode.certificate || "";

        if (base64BufferString) {
            previewContainer.innerHTML = `<img src="${base64BufferString}" style="max-width:140px; border-radius:6px; border: 1px solid var(--border-glass); margin-top:0.5rem;">`;
        }

        document.getElementById('prof-cert-file').addEventListener('change', (e) => {
            const rawFile = e.target.files[0];
            if (rawFile) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    base64BufferString = evt.target.result;
                    previewContainer.innerHTML = `<img src="${base64BufferString}" style="max-width:140px; border-radius:6px; border:1px solid var(--border-glass); margin-top:0.5rem;">`;
                };
                reader.readAsDataURL(rawFile);
            }
        });

        document.getElementById('btn-profile-save-changes').addEventListener('click', () => {
            let coreDatabaseRegistry = JSON.parse(localStorage.getItem(DB_CONFIG.KEYS.USERS_REGISTRY));
            const targetedRowIndex = coreDatabaseRegistry.findIndex(u => u.empId === sessionNode.empId);

            if (targetedRowIndex !== -1) {
                coreDatabaseRegistry[targetedRowIndex].name = document.getElementById('prof-name').value;
                coreDatabaseRegistry[targetedRowIndex].designation = document.getElementById('prof-designation').value;
                coreDatabaseRegistry[targetedRowIndex].department = document.getElementById('prof-dept').value;
                coreDatabaseRegistry[targetedRowIndex].location = document.getElementById('prof-location').value;
                coreDatabaseRegistry[targetedRowIndex].mobile = document.getElementById('prof-mobile').value;
                coreDatabaseRegistry[targetedRowIndex].personalEmail = document.getElementById('prof-personal-email').value;
                coreDatabaseRegistry[targetedRowIndex].bloodGroup = document.getElementById('prof-blood').value;
                coreDatabaseRegistry[targetedRowIndex].emergencyContact = document.getElementById('prof-emergency').value;
                coreDatabaseRegistry[targetedRowIndex].bio = document.getElementById('prof-bio').value;
                coreDatabaseRegistry[targetedRowIndex].cvText = document.getElementById('prof-cv-text').value;
                coreDatabaseRegistry[targetedRowIndex].github = document.getElementById('prof-github').value;
                coreDatabaseRegistry[targetedRowIndex].linkedin = document.getElementById('prof-linkedin').value;
                coreDatabaseRegistry[targetedRowIndex].panNumber = document.getElementById('prof-pan').value;
                coreDatabaseRegistry[targetedRowIndex].pfNumber = document.getElementById('prof-pf').value;
                coreDatabaseRegistry[targetedRowIndex].bankName = document.getElementById('prof-bank-name').value;
                coreDatabaseRegistry[targetedRowIndex].bankAccount = document.getElementById('prof-bank-acc').value;
                coreDatabaseRegistry[targetedRowIndex].certificate = base64BufferString;

                localStorage.setItem(DB_CONFIG.KEYS.USERS_REGISTRY, JSON.stringify(coreDatabaseRegistry));
                localStorage.setItem(DB_CONFIG.KEYS.SESSION_NODE, JSON.stringify(coreDatabaseRegistry[targetedRowIndex]));
                createNotificationToast('GUVI Profile mapping schemas updated successfully.');
            }
        });
    }

}());
