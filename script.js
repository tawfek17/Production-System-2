const STORAGE_KEY = "production_system_v6";
const FIREBASE_PATH = "productionSystem";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPMA_mU7ZgDQWFa-Z9RXdDKb1hWcSTU7I",
  authDomain: "production-system-d7fb1.firebaseapp.com",
  projectId: "production-system-d7fb1",
  storageBucket: "production-system-d7fb1.firebasestorage.app",
  messagingSenderId: "498087576836",
  appId: "1:498087576836:web:7a92c848408dcdc6173c51",
  measurementId: "G-G5X0C3HPZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


const defaultState = {
    leaders: [
        {
            id: "leader_assembly_1",
            username: "assembly",
            password: "1234",
            department: "assembly"
        },
        {
            id: "leader_packing_1",
            username: "packing",
            password: "1234",
            department: "packing"
        }
    ],

    orders: [
        {
            id: "order_1001",
            orderNumber: "ORD-1001",
            model: "Model A",
            color: "Black",
            target: 1000
        },
        {
            id: "order_1002",
            orderNumber: "ORD-1002",
            model: "Model B",
            color: "White",
            target: 800
        },
        {
            id: "order_1003",
            orderNumber: "ORD-1003",
            model: "Model C",
            color: "Blue",
            target: 1200
        }
    ],

    production: []
};


let state = loadLocalState();

let currentUser = null;

let firebaseReady = false;
let firebaseInitializing = false;
let firebaseDatabase = null;
let firebaseRootRef = null;
let firebaseSet = null;
let firebaseOnValue = null;

let firebaseReadyPromise = null;

let suppressFirebaseListener = false;


/* =========================
   LOCAL STATE
========================= */

function cloneDefaultState() {
    return JSON.parse(
        JSON.stringify(defaultState)
    );
}


function normalizeArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === "object") {
        return Object.values(value);
    }

    return [];
}


function normalizeState(value) {

    const source =
        value && typeof value === "object"
            ? value
            : {};

    return {
        leaders: normalizeArray(
            source.leaders
        ),

        orders: normalizeArray(
            source.orders
        ),

        production: normalizeArray(
            source.production
        )
    };
}


function loadLocalState() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (!saved) {

        const fresh =
            cloneDefaultState();

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(fresh)
        );

        return fresh;
    }

    try {

        return normalizeState(
            JSON.parse(saved)
        );

    } catch {

        const fresh =
            cloneDefaultState();

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(fresh)
        );

        return fresh;
    }
}


function cacheState() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
}


/* =========================
   FIREBASE
========================= */

function showFirebaseStatus(
    message,
    type = ""
) {

    let element =
        document.getElementById(
            "firebaseStatus"
        );

    if (!element) {

        element =
            document.createElement("div");

        element.id =
            "firebaseStatus";

        element.style.position =
            "fixed";

        element.style.left =
            "15px";

        element.style.bottom =
            "15px";

        element.style.zIndex =
            "99999";

        element.style.padding =
            "9px 13px";

        element.style.borderRadius =
            "8px";

        element.style.fontSize =
            "12px";

        element.style.fontWeight =
            "bold";

        element.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.15)";

        document.body.appendChild(
            element
        );
    }

    element.textContent =
        message;

    if (type === "success") {

        element.style.background =
            "#dcfce7";

        element.style.color =
            "#166534";

    } else if (type === "error") {

        element.style.background =
            "#fee2e2";

        element.style.color =
            "#991b1b";

    } else {

        element.style.background =
            "#fef3c7";

        element.style.color =
            "#92400e";
    }
}


async function initFirebase() {

    if (firebaseInitializing) {
        return firebaseReadyPromise;
    }

    firebaseInitializing = true;

    firebaseReadyPromise =
        (async function () {

            try {

                showFirebaseStatus(
                    "Firebase: جاري الاتصال...",
                    "warning"
                );

                const firebaseAppModule =
                    await import(
                        "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
                    );

                const firebaseDatabaseModule =
                    await import(
                        "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js"
                    );

                const {
                    initializeApp
                } = firebaseAppModule;

                const {
                    getDatabase,
                    ref,
                    set,
                    onValue
                } = firebaseDatabaseModule;

                const app =
                    initializeApp(
                        firebaseConfig
                    );

                firebaseDatabase =
                    getDatabase(app);

                firebaseRootRef =
                    ref(
                        firebaseDatabase,
                        FIREBASE_PATH
                    );

                firebaseSet =
                    set;

                firebaseOnValue =
                    onValue;


                await new Promise(
                    (resolve, reject) => {

                        let finished =
                            false;

                        const unsubscribe =
                            firebaseOnValue(
                                firebaseRootRef,

                                async snapshot => {

                                    if (finished) {
                                        return;
                                    }

                                    finished = true;

                                    try {

                                        if (
                                            snapshot.exists()
                                        ) {

                                            state =
                                                normalizeState(
                                                    snapshot.val()
                                                );

                                            cacheState();

                                        } else {

                                            state =
                                                normalizeState(
                                                    state
                                                );

                                            await firebaseSet(
                                                firebaseRootRef,
                                                state
                                            );

                                            cacheState();
                                        }

                                        firebaseReady =
                                            true;

                                        showFirebaseStatus(
                                            "Firebase: متصل — Live Sync",
                                            "success"
                                        );

                                        renderAll();

                                        resolve();

                                    } catch (error) {

                                        console.error(
                                            "Firebase initial sync error:",
                                            error
                                        );

                                        firebaseReady =
                                            false;

                                        showFirebaseStatus(
                                            "Firebase: خطأ أثناء تحميل البيانات",
                                            "error"
                                        );

                                        reject(error);
                                    }
                                },

                                error => {

                                    if (finished) {
                                        return;
                                    }

                                    finished = true;

                                    firebaseReady =
                                        false;

                                    console.error(
                                        "Firebase connection error:",
                                        error
                                    );

                                    showFirebaseStatus(
                                        "Firebase: خطأ في الاتصال",
                                        "error"
                                    );

                                    reject(error);
                                }
                            );

                        setTimeout(
                            () => {

                                if (!finished) {

                                    finished = true;

                                    firebaseReady =
                                        false;

                                    showFirebaseStatus(
                                        "Firebase: انتهت مهلة الاتصال",
                                        "error"
                                    );

                                    reject(
                                        new Error(
                                            "Firebase connection timeout"
                                        )
                                    );
                                }

                            },
                            15000
                        );
                    }
                );


                firebaseOnValue(
                    firebaseRootRef,

                    snapshot => {

                        if (
                            suppressFirebaseListener
                        ) {
                            return;
                        }

                        if (!snapshot.exists()) {
                            return;
                        }

                        state =
                            normalizeState(
                                snapshot.val()
                            );

                        cacheState();

                        renderAll();
                    },

                    error => {

                        console.error(
                            "Firebase Live Sync error:",
                            error
                        );

                        firebaseReady =
                            false;

                        showFirebaseStatus(
                            "Firebase: فقد الاتصال — راجع Rules",
                            "error"
                        );
                    }
                );

                return true;

            } catch (error) {

                console.error(
                    "Firebase initialization failed:",
                    error
                );

                firebaseReady =
                    false;

                showFirebaseStatus(
                    "Firebase: فشل الاتصال — راجع إعدادات Firebase",
                    "error"
                );

                return false;
            }

        })();

    return firebaseReadyPromise;
}


async function waitForFirebase() {

    if (firebaseReady) {
        return true;
    }

    if (!firebaseReadyPromise) {
        await initFirebase();
    }

    try {

        await firebaseReadyPromise;

    } catch {

        return false;
    }

    return firebaseReady;
}


/* =========================
   SAVE STATE
========================= */

async function saveState() {

    const ready =
        await waitForFirebase();

    if (!ready) {

        showFirebaseStatus(
            "Firebase غير متصل — لم يتم حفظ التعديل على السيرفر",
            "error"
        );

        alert(
            "Firebase غير متصل حالياً.\n\nلم يتم حفظ التعديل على السيرفر حتى لا تختلف البيانات بين الأجهزة."
        );

        return false;
    }


    state =
        normalizeState(state);

    cacheState();

    renderAll();


    try {

        suppressFirebaseListener =
            true;

        await firebaseSet(
            firebaseRootRef,
            state
        );

        suppressFirebaseListener =
            false;

        cacheState();

        showFirebaseStatus(
            "Firebase: تم الحفظ — Live Sync",
            "success"
        );

        return true;

    } catch (error) {

        suppressFirebaseListener =
            false;

        console.error(
            "Firebase save error:",
            error
        );

        firebaseReady =
            false;

        showFirebaseStatus(
            "Firebase: فشل حفظ البيانات",
            "error"
        );

        alert(
            "حصل خطأ أثناء حفظ البيانات على Firebase.\nراجع اتصال الإنترنت وFirebase Rules."
        );

        return false;
    }
}


/* =========================
   HELPERS
========================= */

function today() {

    const d =
        new Date();

    const y =
        d.getFullYear();

    const m =
        String(
            d.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            d.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${day}`;
}


function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString("en-US");
}


function percentage(
    value,
    target
) {

    if (!target) {
        return 0;
    }

    return Math.round(
        (value / target) * 100
    );
}


function generateId(prefix) {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


function departmentName(
    department
) {

    if (
        department === "assembly"
    ) {
        return "Assembly";
    }

    if (
        department === "packing"
    ) {
        return "Packing";
    }

    return "Admin";
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function getOrder(orderId) {

    return state.orders.find(
        order =>
            order.id === orderId
    );
}


function getOrderNumber(orderId) {

    const order =
        getOrder(orderId);

    return order
        ? order.orderNumber
        : "-";
}


function getDepartmentProduction(
    department
) {

    return state.production.filter(
        item =>
            item.department ===
            department
    );
}


function getDepartmentDateProduction(
    department,
    date
) {

    return state.production.filter(
        item =>
            item.department ===
                department &&
            item.date === date
    );
}


/* =========================
   LOGIN
========================= */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const username =
                document
                    .getElementById(
                        "loginUsername"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;

            const department =
                document
                    .getElementById(
                        "loginDepartment"
                    )
                    .value;

            const error =
                document
                    .getElementById(
                        "loginError"
                    );


            error.textContent =
                "";


            const ready =
                await waitForFirebase();

            if (!ready) {

                error.textContent =
                    "لا يمكن تسجيل الدخول الآن لأن Firebase غير متصل.";

                return;
            }


            if (
                department === "admin" &&
                username === "admin" &&
                password === "admin123"
            ) {

                currentUser = {
                    id: "admin",
                    username: "admin",
                    department: "admin"
                };

                openApp();

                return;
            }


            const leader =
                state.leaders.find(
                    item =>
                        item.username ===
                            username &&
                        item.password ===
                            password &&
                        item.department ===
                            department
                );


            if (!leader) {

                error.textContent =
                    "Username أو Password أو القسم غير صحيح";

                return;
            }


            currentUser = {

                id: leader.id,

                username:
                    leader.username,

                department:
                    leader.department
            };


            openApp();
        }
    );


function openApp() {

    document
        .getElementById(
            "loginPage"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "appPage"
        )
        .classList.remove(
            "hidden"
        );


    document.getElementById(
        "currentUsername"
    ).textContent =
        currentUser.username;


    document.getElementById(
        "currentDepartment"
    ).textContent =
        departmentName(
            currentUser.department
        );


    setupInterface();

    renderAll();
}


/* =========================
   INTERFACE
========================= */

function setupInterface() {

    const admin =
        currentUser.department ===
        "admin";


    document
        .querySelectorAll(
            ".admin-only"
        )
        .forEach(button => {

            button.style.display =
                admin
                    ? ""
                    : "none";
        });


    document
        .getElementById(
            "adminDashboard"
        )
        .classList.toggle(
            "hidden",
            !admin
        );


    document
        .getElementById(
            "leaderDashboard"
        )
        .classList.toggle(
            "hidden",
            admin
        );


    document
        .getElementById(
            "leaderDepartmentTitle"
        )
        .textContent =
        departmentName(
            currentUser.department
        ) +
        " Dashboard";


    document
        .getElementById(
            "leaderStatsTitle"
        )
        .textContent =
        departmentName(
            currentUser.department
        ) +
        " Model Statistics";


    document
        .getElementById(
            "productionDate"
        )
        .value =
        today();


    document
        .getElementById(
            "productionFilterDate"
        )
        .value =
        today();


    document
        .getElementById(
            "leaderStatsDate"
        )
        .value =
        today();


    document
        .getElementById(
            "adminAssemblyDate"
        )
        .value =
        today();


    document
        .getElementById(
            "adminPackingDate"
        )
        .value =
        today();


    document
        .getElementById(
            "adminRecordsDate"
        )
        .value =
        today();
}


/* =========================
   NAVIGATION
========================= */

document
    .querySelectorAll(
        ".nav-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const page =
                    this.dataset.page;


                document
                    .querySelectorAll(
                        ".nav-btn"
                    )
                    .forEach(btn =>
                        btn.classList.remove(
                            "active"
                        )
                    );


                this.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".main-content > section"
                    )
                    .forEach(section =>
                        section.classList.add(
                            "hidden"
                        )
                    );


                document
                    .getElementById(
                        page + "Page"
                    )
                    .classList.remove(
                        "hidden"
                    );
            }
        );
    });


document
    .getElementById(
        "logoutBtn"
    )
    .addEventListener(
        "click",
        function () {

            currentUser =
                null;

            document
                .getElementById(
                    "appPage"
                )
                .classList.add(
                    "hidden"
                );

            document
                .getElementById(
                    "loginPage"
                )
                .classList.remove(
                    "hidden"
                );

            document
                .getElementById(
                    "loginForm"
                )
                .reset();

            document
                .getElementById(
                    "loginError"
                )
                .textContent =
                "";
        }
    );


/* =========================
   ORDER SELECT
========================= */

function populateOrderSelect() {

    const select =
        document.getElementById(
            "productionOrder"
        );

    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    select.innerHTML =
        `<option value="">اختار Order</option>`;


    state.orders.forEach(
        order => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                order.id;

            option.textContent =
                `${order.model} - ${order.orderNumber} - ${order.color}`;

            select.appendChild(
                option
            );
        }
    );


    if (currentValue) {

        select.value =
            currentValue;
    }
}


document
    .getElementById(
        "productionOrder"
    )
    .addEventListener(
        "change",
        function () {

            const order =
                getOrder(
                    this.value
                );


            document
                .getElementById(
                    "productionModel"
                )
                .value =
                order
                    ? order.model
                    : "";


            document
                .getElementById(
                    "productionColor"
                )
                .value =
                order
                    ? order.color
                    : "";
        }
    );


/* =========================
   PRODUCTION
========================= */

document
    .getElementById(
        "productionForm"
    )
    .addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const id =
                document
                    .getElementById(
                        "productionId"
                    )
                    .value;


            const date =
                document
                    .getElementById(
                        "productionDate"
                    )
                    .value;


            const orderId =
                document
                    .getElementById(
                        "productionOrder"
                    )
                    .value;


            const quantity =
                Number(
                    document
                        .getElementById(
                            "productionQuantity"
                        )
                        .value
                );


            const order =
                getOrder(
                    orderId
                );


            if (!order) {

                alert(
                    "اختار Order صحيح"
                );

                return;
            }


            if (
                !quantity ||
                quantity <= 0
            ) {

                alert(
                    "اكتب Quantity صحيحة"
                );

                return;
            }


            const ready =
                await waitForFirebase();

            if (!ready) {

                alert(
                    "Firebase غير متصل.\nلا يمكن حفظ الإنتاج الآن."
                );

                return;
            }


            if (id) {

                const record =
                    state.production.find(
                        item =>
                            item.id === id
                    );


                if (!record) {
                    return;
                }


                record.date =
                    date;

                record.orderId =
                    orderId;

                record.model =
                    order.model;

                record.color =
                    order.color;

                record.quantity =
                    quantity;

                record.updatedAt =
                    new Date().toISOString();

            } else {

                state.production.push({

                    id:
                        generateId(
                            "production"
                        ),

                    date,

                    department:
                        currentUser.department,

                    leaderId:
                        currentUser.id,

                    orderId,

                    model:
                        order.model,

                    color:
                        order.color,

                    quantity,

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()
                });
            }


            const saved =
                await saveState();


            if (saved) {

                resetProductionForm();
            }
        }
    );


function resetProductionForm() {

    document
        .getElementById(
            "productionForm"
        )
        .reset();


    document
        .getElementById(
            "productionId"
        )
        .value =
        "";


    document
        .getElementById(
            "productionDate"
        )
        .value =
        today();


    document
        .getElementById(
            "cancelEditBtn"
        )
        .classList.add(
            "hidden"
        );
}


document
    .getElementById(
        "cancelEditBtn"
    )
    .addEventListener(
        "click",
        resetProductionForm
    );


function editProduction(id) {

    const record =
        state.production.find(
            item =>
                item.id === id
        );


    if (!record) {
        return;
    }


    if (
        currentUser.department !==
            "admin" &&
        record.department !==
            currentUser.department
    ) {
        return;
    }


    document
        .getElementById(
            "productionId"
        )
        .value =
        record.id;


    document
        .getElementById(
            "productionDate"
        )
        .value =
        record.date;


    document
        .getElementById(
            "productionOrder"
        )
        .value =
        record.orderId;


    const order =
        getOrder(
            record.orderId
        );


    document
        .getElementById(
            "productionModel"
        )
        .value =
        order
            ? order.model
            : record.model;


    document
        .getElementById(
            "productionColor"
        )
        .value =
        order
            ? order.color
            : record.color;


    document
        .getElementById(
            "productionQuantity"
        )
        .value =
        record.quantity;


    document
        .getElementById(
            "cancelEditBtn"
        )
        .classList.remove(
            "hidden"
        );


    document
        .querySelector(
            '[data-page="production"]'
        )
        .click();
}


async function deleteProduction(id) {

    if (
        !confirm(
            "هل تريد حذف سجل الإنتاج؟"
        )
    ) {
        return;
    }


    const ready =
        await waitForFirebase();

    if (!ready) {

        alert(
            "Firebase غير متصل.\nلم يتم حذف السجل."
        );

        return;
    }


    state.production =
        state.production.filter(
            item =>
                item.id !== id
        );


    await saveState();
}


/* =========================
   PRODUCTION TABLE
========================= */

function renderMyProduction() {

    const tbody =
        document.getElementById(
            "myProductionTable"
        );


    if (
        !currentUser
    ) {
        return;
    }


    const filterDate =
        document.getElementById(
            "productionFilterDate"
        ).value;


    let records =
        state.production.filter(
            item =>
                item.department ===
                currentUser.department
        );


    if (filterDate) {

        records =
            records.filter(
                item =>
                    item.date ===
                    filterDate
            );
    }


    records.sort(
        (a, b) =>
            new Date(
                b.createdAt
            ) -
            new Date(
                a.createdAt
            )
    );


    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        لا يوجد Production Records
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        records
            .map(
                record => {

                    const leader =
                        state.leaders.find(
                            item =>
                                item.id ===
                                record.leaderId
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    departmentName(
                                        record.department
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getOrderNumber(
                                        record.orderId
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    record.model
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    record.color
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${formatNumber(
                                        record.quantity
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    leader
                                        ? leader.username
                                        : "-"
                                )}
                            </td>

                            <td>

                                <div class="actions">

                                    <button
                                        class="edit-btn"
                                        onclick="editProduction('${record.id}')">
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn"
                                        onclick="deleteProduction('${record.id}')">
                                        Delete
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================
   ADMIN DASHBOARD
========================= */

function renderAdminDashboard() {

    document.getElementById(
        "adminTotalOrders"
    ).textContent =
        formatNumber(
            state.orders.length
        );


    const assemblyToday =
        getDepartmentDateProduction(
            "assembly",
            today()
        );


    const packingToday =
        getDepartmentDateProduction(
            "packing",
            today()
        );


    document.getElementById(
        "adminAssemblyToday"
    ).textContent =
        formatNumber(
            assemblyToday.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity
                    ),
                0
            )
        );


    document.getElementById(
        "adminPackingToday"
    ).textContent =
        formatNumber(
            packingToday.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity
                    ),
                0
            )
        );


    document.getElementById(
        "adminTotalProduction"
    ).textContent =
        formatNumber(
            state.production.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity
                    ),
                0
            )
        );


    renderAdminDepartmentStats(
        "assembly",
        document.getElementById(
            "adminAssemblyDate"
        ).value
    );


    renderAdminDepartmentStats(
        "packing",
        document.getElementById(
            "adminPackingDate"
        ).value
    );


    renderAdminOrderProgress();


    drawDepartmentChart(
        "assembly",
        "assemblyChart"
    );


    drawDepartmentChart(
        "packing",
        "packingChart"
    );
}


function renderAdminDepartmentStats(
    department,
    date
) {

    const container =
        document.getElementById(
            department ===
                "assembly"
                ? "adminAssemblyStats"
                : "adminPackingStats"
        );


    const todayRecords =
        getDepartmentDateProduction(
            department,
            date
        );


    const todayProduction =
        todayRecords.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity
                ),
            0
        );


    const activeOrderIds =
        [
            ...new Set(
                todayRecords.map(
                    item =>
                        item.orderId
                )
            )
        ];


    const todayTarget =
        activeOrderIds.reduce(
            (
                sum,
                orderId
            ) => {

                const order =
                    getOrder(
                        orderId
                    );

                return (
                    sum +
                    Number(
                        order
                            ? order.target
                            : 0
                    )
                );
            },
            0
        );


    const allProduction =
        getDepartmentProduction(
            department
        );


    const totalProduction =
        allProduction.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity
                ),
            0
        );


    const totalTarget =
        state.orders.reduce(
            (sum, order) =>
                sum +
                Number(
                    order.target
                ),
            0
        );


    const todayAchievement =
        percentage(
            todayProduction,
            todayTarget
        );


    const totalAchievement =
        percentage(
            totalProduction,
            totalTarget
        );


    container.innerHTML = `

        <div class="stat-box">
            <span>Today's Target</span>
            <strong>
                ${formatNumber(
                    todayTarget
                )}
            </strong>
        </div>

        <div class="stat-box">
            <span>Today's Production</span>
            <strong>
                ${formatNumber(
                    todayProduction
                )}
            </strong>
        </div>

        <div class="stat-box">
            <span>Today's Achievement</span>
            <strong>
                ${todayAchievement}%
            </strong>
        </div>

        <div class="stat-box">
            <span>Total Target</span>
            <strong>
                ${formatNumber(
                    totalTarget
                )}
            </strong>
        </div>

        <div class="stat-box">
            <span>Total Production</span>
            <strong>
                ${formatNumber(
                    totalProduction
                )}
            </strong>
        </div>

        <div class="stat-box">
            <span>Total Achievement</span>
            <strong>
                ${totalAchievement}%
            </strong>
        </div>

    `;
}


/* =========================
   LEADER DASHBOARD
========================= */

function renderLeaderDashboard() {

    const department =
        currentUser.department;


    const todayDate =
        today();


    const todayRecords =
        getDepartmentDateProduction(
            department,
            todayDate
        );


    const todayProduction =
        todayRecords.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity
                ),
            0
        );


    const activeOrderIds =
        [
            ...new Set(
                todayRecords.map(
                    item =>
                        item.orderId
                )
            )
        ];


    const todayTarget =
        activeOrderIds.reduce(
            (
                sum,
                orderId
            ) => {

                const order =
                    getOrder(
                        orderId
                    );

                return (
                    sum +
                    Number(
                        order
                            ? order.target
                            : 0
                    )
                );
            },
            0
        );


    const allProduction =
        getDepartmentProduction(
            department
        );


    const totalProduction =
        allProduction.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity
                ),
            0
        );


    const totalTarget =
        state.orders.reduce(
            (sum, order) =>
                sum +
                Number(
                    order.target
                ),
            0
        );


    document.getElementById(
        "leaderTodayTarget"
    ).textContent =
        formatNumber(
            todayTarget
        );


    document.getElementById(
        "leaderTodayProduction"
    ).textContent =
        formatNumber(
            todayProduction
        );


    document.getElementById(
        "leaderTodayAchievement"
    ).textContent =
        percentage(
            todayProduction,
            todayTarget
        ) + "%";


    document.getElementById(
        "leaderTotalTarget"
    ).textContent =
        formatNumber(
            totalTarget
        );


    document.getElementById(
        "leaderTotalProduction"
    ).textContent =
        formatNumber(
            totalProduction
        );


    document.getElementById(
        "leaderAchievement"
    ).textContent =
        percentage(
            totalProduction,
            totalTarget
        ) + "%";


    renderLeaderOrderProgress();
}


function renderLeaderStats() {

    const department =
        currentUser.department;


    const date =
        document.getElementById(
            "leaderStatsDate"
        ).value;


    const container =
        document.getElementById(
            "leaderModernStats"
        );


    if (!state.orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                لا يوجد Orders
            </div>
        `;

        return;
    }


    container.innerHTML =
        state.orders
            .map(
                order => {

                    const production =
                        state.production
                            .filter(
                                item =>
                                    item.department ===
                                        department &&
                                    item.date ===
                                        date &&
                                    item.orderId ===
                                        order.id
                            )
                            .reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    Number(
                                        item.quantity
                                    ),
                                0
                            );


                    const target =
                        Number(
                            order.target
                        );


                    const remaining =
                        Math.max(
                            target -
                                production,
                            0
                        );


                    const achievement =
                        percentage(
                            production,
                            target
                        );


                    const progress =
                        Math.min(
                            achievement,
                            100
                        );


                    return `
                        <div class="leader-model-card">

                            <div class="leader-model-header">

                                <div>

                                    <div class="leader-model-name">
                                        ${escapeHTML(
                                            order.model
                                        )}
                                    </div>

                                    <div class="leader-model-order">
                                        ${escapeHTML(
                                            order.orderNumber
                                        )}
                                        •
                                        ${escapeHTML(
                                            order.color
                                        )}
                                    </div>

                                </div>

                                <div class="leader-model-achievement">
                                    ${achievement}%
                                </div>

                            </div>


                            <div class="leader-model-values">

                                <div class="leader-model-value">
                                    <span>Target</span>
                                    <strong>
                                        ${formatNumber(
                                            target
                                        )}
                                    </strong>
                                </div>

                                <div class="leader-model-value">
                                    <span>Today Production</span>
                                    <strong>
                                        ${formatNumber(
                                            production
                                        )}
                                    </strong>
                                </div>

                                <div class="leader-model-value">
                                    <span>Remaining</span>
                                    <strong>
                                        ${formatNumber(
                                            remaining
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div class="leader-model-progress">

                                <div
                                    class="leader-model-progress-fill"
                                    style="width:${progress}%">
                                </div>

                            </div>


                            <div class="leader-model-footer">

                                <span>
                                    ${achievement}% Complete
                                </span>

                                <span>
                                    ${formatNumber(
                                        production
                                    )}
                                    /
                                    ${formatNumber(
                                        target
                                    )}
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================
   LEADER ORDER PROGRESS
========================= */

function renderLeaderOrderProgress() {

    const container =
        document.getElementById(
            "leaderOrderProgress"
        );


    const department =
        currentUser.department;


    if (!state.orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                لا يوجد Orders
            </div>
        `;

        return;
    }


    container.innerHTML =
        state.orders
            .map(
                order => {

                    const departmentProduction =
                        state.production
                            .filter(
                                item =>
                                    item.department ===
                                        department &&
                                    item.orderId ===
                                        order.id
                            )
                            .reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    Number(
                                        item.quantity
                                    ),
                                0
                            );


                    const target =
                        Number(
                            order.target
                        );


                    const remaining =
                        Math.max(
                            target -
                                departmentProduction,
                            0
                        );


                    const completion =
                        percentage(
                            departmentProduction,
                            target
                        );


                    const progress =
                        Math.min(
                            completion,
                            100
                        );


                    let achievementClass =
                        "achievement-danger";


                    if (
                        completion >=
                        100
                    ) {

                        achievementClass =
                            "achievement-good";

                    } else if (
                        completion >=
                        70
                    ) {

                        achievementClass =
                            "achievement-warning";
                    }


                    return `
                        <div class="order-progress-card">

                            <div class="order-progress-header">

                                <div>

                                    <div class="order-progress-name">
                                        ${escapeHTML(
                                            order.model
                                        )}
                                    </div>

                                    <div class="order-progress-subtitle">
                                        ${escapeHTML(
                                            order.orderNumber
                                        )}
                                        •
                                        ${escapeHTML(
                                            order.color
                                        )}
                                    </div>

                                </div>

                                <div class="order-progress-achievement ${achievementClass}">
                                    ${completion}%
                                </div>

                            </div>


                            <div class="order-progress-values">

                                <div class="order-progress-value">
                                    <span>Target</span>
                                    <strong>
                                        ${formatNumber(
                                            target
                                        )}
                                    </strong>
                                </div>

                                <div class="order-progress-value">
                                    <span>${departmentName(
                                        department
                                    )}</span>
                                    <strong>
                                        ${formatNumber(
                                            departmentProduction
                                        )}
                                    </strong>
                                </div>

                                <div class="order-progress-value">
                                    <span>Remaining</span>
                                    <strong>
                                        ${formatNumber(
                                            remaining
                                        )}
                                    </strong>
                                </div>

                                <div class="order-progress-value">
                                    <span>Achievement</span>
                                    <strong>
                                        ${completion}%
                                    </strong>
                                </div>

                            </div>


                            <div class="order-progress-bar">

                                <div
                                    class="order-progress-fill"
                                    style="width:${progress}%">
                                </div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================
   ADMIN ORDER PROGRESS
========================= */

function renderAdminOrderProgress() {

    const container =
        document.getElementById(
            "adminOrderProgress"
        );


    if (!state.orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                لا يوجد Orders
            </div>
        `;

        return;
    }


    container.innerHTML =
        state.orders
            .map(
                order => {

                    const assembly =
                        getOrderProduction(
                            order.id,
                            "assembly"
                        );


                    const packing =
                        getOrderProduction(
                            order.id,
                            "packing"
                        );


                    const target =
                        Number(
                            order.target
                        );


                    const remaining =
                        Math.max(
                            target -
                                packing,
                            0
                        );


                    const completion =
                        percentage(
                            packing,
                            target
                        );


                    const progress =
                        Math.min(
                            completion,
                            100
                        );


                    let achievementClass =
                        "achievement-danger";


                    if (
                        completion >=
                        100
                    ) {

                        achievementClass =
                            "achievement-good";

                    } else if (
                        completion >=
                        70
                    ) {

                        achievementClass =
                            "achievement-warning";
                    }


                    return `
                        <div class="order-progress-card">

                            <div class="order-progress-header">

                                <div>

                                    <div class="order-progress-name">
                                        ${escapeHTML(
                                            order.model
                                        )}
                                    </div>

                                    <div class="order-progress-subtitle">
                                        ${escapeHTML(
                                            order.orderNumber
                                        )}
                                        •
                                        ${escapeHTML(
                                            order.color
                                        )}
                                    </div>

                                </div>

                                <div class="order-progress-achievement ${achievementClass}">
                                    ${completion}%
                                </div>

                            </div>


                            <div class="order-progress-values">

                                <div class="order-progress-value">
                                    <span>Target</span>
                                    <strong>
                                        ${formatNumber(
                                            target
                                        )}
                                    </strong>
                                </div>

                                <div class="order-progress-value">
                                    <span>Assembly</span>
                                    <strong>
                                        ${formatNumber(
                                            assembly
                                        )}
                                    </strong>
                                </div>

                                <div class="order-progress-value">
                                    <span>Packing</span>
                                    <strong>
                                        ${formatNumber(
                                            packing
                                        )}
                                    </strong>
                                </div>

                                <div class="order-progress-value">
                                    <span>Remaining</span>
                                    <strong>
                                        ${formatNumber(
                                            remaining
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div class="order-progress-bar">

                                <div
                                    class="order-progress-fill"
                                    style="width:${progress}%">
                                </div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


function getOrderProduction(
    orderId,
    department
) {

    return state.production
        .filter(
            item =>
                item.orderId ===
                    orderId &&
                item.department ===
                    department
        )
        .reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity
                ),
            0
        );
}


/* =========================
   CHARTS
========================= */

function drawDepartmentChart(
    department,
    canvasId
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const parent =
        canvas.parentElement;


    const width =
        parent.clientWidth;

    const height =
        parent.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {
        return;
    }


    const dpr =
        window.devicePixelRatio ||
        1;


    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const values = [];
    const labels = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();


        date.setDate(
            date.getDate() -
                i
        );


        const label =
            date.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            );


        const y =
            date.getFullYear();


        const m =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        const dateString =
            `${y}-${m}-${day}`;


        const total =
            getDepartmentDateProduction(
                department,
                dateString
            ).reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity
                    ),
                0
            );


        labels.push(
            label
        );

        values.push(
            total
        );
    }


    drawVerticalBarChart(
        ctx,
        width,
        height,
        values,
        labels
    );
}


function drawLeaderChart() {

    if (
        !currentUser ||
        currentUser.department ===
            "admin"
    ) {
        return;
    }


    drawDepartmentChart(
        currentUser.department,
        "leaderChart"
    );
}


function drawVerticalBarChart(
    ctx,
    width,
    height,
    values,
    labels
) {

    const padding =
        45;


    const chartWidth =
        width -
        padding * 2;


    const chartHeight =
        height -
        padding * 2;


    const max =
        Math.max(
            ...values,
            1
        );


    ctx.font =
        "11px Arial";


    ctx.textAlign =
        "center";


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding +
            chartHeight -
            (
                chartHeight *
                i /
                4
            );


        ctx.beginPath();


        ctx.moveTo(
            padding,
            y
        );


        ctx.lineTo(
            width -
                padding,
            y
        );


        ctx.strokeStyle =
            "#e5e7eb";


        ctx.stroke();


        ctx.fillStyle =
            "#6b7280";


        ctx.textAlign =
            "right";


        ctx.fillText(
            formatNumber(
                Math.round(
                    max *
                    i /
                    4
                )
            ),
            padding -
                7,
            y + 4
        );
    }


    const barGap =
        20;


    const barWidth =
        (
            chartWidth -
            barGap *
                (
                    values.length -
                    1
                )
        ) /
        values.length;


    values.forEach(
        (
            value,
            index
        ) => {

            const barHeight =
                max
                    ? (
                        value /
                        max
                    ) *
                    chartHeight
                    : 0;


            const x =
                padding +
                index *
                (
                    barWidth +
                    barGap
                );


            const y =
                padding +
                chartHeight -
                barHeight;


            ctx.fillStyle =
                "#2563eb";


            ctx.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );


            ctx.fillStyle =
                "#111827";


            ctx.textAlign =
                "center";


            ctx.font =
                "bold 11px Arial";


            ctx.fillText(
                formatNumber(
                    value
                ),
                x +
                    barWidth /
                    2,
                Math.max(
                    y - 7,
                    12
                )
            );


            ctx.fillStyle =
                "#6b7280";


            ctx.font =
                "11px Arial";


            ctx.fillText(
                labels[index],
                x +
                    barWidth /
                    2,
                height -
                    15
            );
        }
    );
}


/* =========================
   ORDERS
========================= */

document
    .getElementById(
        "orderForm"
    )
    .addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const orderNumber =
                document
                    .getElementById(
                        "orderNumber"
                    )
                    .value
                    .trim();


            const model =
                document
                    .getElementById(
                        "orderModel"
                    )
                    .value
                    .trim();


            const color =
                document
                    .getElementById(
                        "orderColor"
                    )
                    .value
                    .trim();


            const target =
                Number(
                    document
                        .getElementById(
                            "orderTarget"
                        )
                        .value
                );


            if (
                !orderNumber ||
                !model ||
                !color ||
                !target
            ) {
                return;
            }


            const exists =
                state.orders.some(
                    order =>
                        order.orderNumber
                            .toLowerCase() ===
                        orderNumber
                            .toLowerCase()
                );


            if (exists) {

                alert(
                    "رقم الـ Order موجود بالفعل"
                );

                return;
            }


            const ready =
                await waitForFirebase();

            if (!ready) {

                alert(
                    "Firebase غير متصل.\nلم يتم إضافة الـ Order."
                );

                return;
            }


            state.orders.push({

                id:
                    generateId(
                        "order"
                    ),

                orderNumber,

                model,

                color,

                target
            });


            const saved =
                await saveState();


            if (saved) {

                this.reset();
            }
        }
    );


async function deleteOrder(id) {

    const order =
        getOrder(id);


    if (!order) {
        return;
    }


    if (
        !confirm(
            `هل تريد حذف Order ${order.orderNumber}؟\nسيتم حذف كل الإنتاج المرتبط به.`
        )
    ) {
        return;
    }


    const ready =
        await waitForFirebase();

    if (!ready) {

        alert(
            "Firebase غير متصل.\nلم يتم حذف الـ Order."
        );

        return;
    }


    state.orders =
        state.orders.filter(
            item =>
                item.id !== id
        );


    state.production =
        state.production.filter(
            item =>
                item.orderId !== id
        );


    await saveState();
}


function renderOrdersTable() {

    const tbody =
        document.getElementById(
            "ordersTable"
        );


    if (!state.orders.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        لا يوجد Orders
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        state.orders
            .map(
                order => {

                    const assembly =
                        getOrderProduction(
                            order.id,
                            "assembly"
                        );


                    const packing =
                        getOrderProduction(
                            order.id,
                            "packing"
                        );


                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        order.model
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    order.orderNumber
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    order.color
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    order.target
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    assembly
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    packing
                                )}
                            </td>

                            <td>

                                <button
                                    class="danger-btn"
                                    onclick="deleteOrder('${order.id}')">
                                    Delete
                                </button>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================
   LEADERS
========================= */

document
    .getElementById(
        "leaderForm"
    )
    .addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const username =
                document
                    .getElementById(
                        "leaderUsername"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "leaderPassword"
                    )
                    .value;


            const department =
                document
                    .getElementById(
                        "leaderDepartment"
                    )
                    .value;


            if (
                !username ||
                !password ||
                !department
            ) {
                return;
            }


            const exists =
                state.leaders.some(
                    leader =>
                        leader.username
                            .toLowerCase() ===
                        username
                            .toLowerCase()
                );


            if (exists) {

                alert(
                    "Username موجود بالفعل"
                );

                return;
            }


            const ready =
                await waitForFirebase();

            if (!ready) {

                alert(
                    "Firebase غير متصل.\nلم يتم إنشاء الحساب."
                );

                return;
            }


            state.leaders.push({

                id:
                    generateId(
                        "leader"
                    ),

                username,

                password,

                department
            });


            const saved =
                await saveState();


            if (saved) {

                this.reset();
            }
        }
    );


async function deleteLeader(id) {

    if (
        !confirm(
            "هل تريد حذف حساب الليدر؟"
        )
    ) {
        return;
    }


    const ready =
        await waitForFirebase();

    if (!ready) {

        alert(
            "Firebase غير متصل.\nلم يتم حذف الحساب."
        );

        return;
    }


    state.leaders =
        state.leaders.filter(
            leader =>
                leader.id !== id
        );


    await saveState();
}


function renderLeadersTable() {

    const tbody =
        document.getElementById(
            "leadersTable"
        );


    if (!state.leaders.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="empty-state">
                        لا يوجد Leaders
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        state.leaders
            .map(
                leader => {

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        leader.username
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${departmentName(
                                    leader.department
                                )}
                            </td>

                            <td>

                                <button
                                    class="danger-btn"
                                    onclick="deleteLeader('${leader.id}')">
                                    Delete
                                </button>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================
   ADMIN RECORDS
========================= */

function renderRecords() {

    const tbody =
        document.getElementById(
            "recordsTable"
        );


    if (
        !currentUser ||
        currentUser.department !==
            "admin"
    ) {
        return;
    }


    const date =
        document
            .getElementById(
                "adminRecordsDate"
            )
            .value;


    let records =
        [...state.production];


    if (date) {

        records =
            records.filter(
                item =>
                    item.date ===
                    date
            );
    }


    records.sort(
        (a, b) =>
            new Date(
                b.createdAt
            ) -
            new Date(
                a.createdAt
            )
    );


    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        لا يوجد Records
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        records
            .map(
                record => {

                    const leader =
                        state.leaders.find(
                            item =>
                                item.id ===
                                record.leaderId
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${departmentName(
                                    record.department
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    leader
                                        ? leader.username
                                        : "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getOrderNumber(
                                        record.orderId
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    record.model
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    record.color
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${formatNumber(
                                        record.quantity
                                    )}
                                </strong>
                            </td>

                            <td>

                                <div class="actions">

                                    <button
                                        class="edit-btn"
                                        onclick="editProduction('${record.id}')">
                                        Edit
                                    </button>

                                    <button
                                        class="danger-btn"
                                        onclick="deleteProduction('${record.id}')">
                                        Delete
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================
   FILTERS
========================= */

document
    .getElementById(
        "productionFilterDate"
    )
    .addEventListener(
        "change",
        renderMyProduction
    );


document
    .getElementById(
        "leaderStatsDate"
    )
    .addEventListener(
        "change",
        function () {

            renderLeaderStats();

            drawLeaderChart();
        }
    );


document
    .getElementById(
        "adminAssemblyDate"
    )
    .addEventListener(
        "change",
        renderAll
    );


document
    .getElementById(
        "adminPackingDate"
    )
    .addEventListener(
        "change",
        renderAll
    );


document
    .getElementById(
        "adminRecordsDate"
    )
    .addEventListener(
        "change",
        renderRecords
    );


/* =========================
   RENDER ALL
========================= */

function renderAll() {

    if (!currentUser) {
        return;
    }


    state =
        normalizeState(
            state
        );


    populateOrderSelect();

    renderMyProduction();

    renderLeadersTable();

    renderOrdersTable();

    renderRecords();


    if (
        currentUser.department ===
        "admin"
    ) {

        renderAdminDashboard();

    } else {

        renderLeaderDashboard();

        renderLeaderStats();

        drawLeaderChart();
    }
}


/* =========================
   LOCAL STORAGE CHANGE
========================= */

window.addEventListener(
    "storage",
    function (e) {

        if (
            e.key ===
            STORAGE_KEY
        ) {

            state =
                loadLocalState();

            renderAll();
        }
    }
);


/* =========================
   RESIZE
========================= */

window.addEventListener(
    "resize",
    function () {

        if (!currentUser) {
            return;
        }


        if (
            currentUser.department ===
            "admin"
        ) {

            drawDepartmentChart(
                "assembly",
                "assemblyChart"
            );

            drawDepartmentChart(
                "packing",
                "packingChart"
            );

        } else {

            drawLeaderChart();
        }
    }
);


/* =========================
   GLOBAL FUNCTIONS
========================= */

window.editProduction =
    editProduction;

window.deleteProduction =
    deleteProduction;

window.deleteOrder =
    deleteOrder;

window.deleteLeader =
    deleteLeader;


/* =========================
   START FIREBASE
========================= */

initFirebase();
