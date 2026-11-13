

/* GET HTML ELEMENTS */
const welcomePage = document.getElementById("welcomePage");
const loginPage = document.getElementById("loginPage");
const introPage = document.getElementById("introPage");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const expenseForm = document.getElementById("expenseForm");


/* LOAD SAVED DATA */
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budget = Number(localStorage.getItem("budget")) || 5000;

let expenseChart = null;


/* SAVE EXPENSES */
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}


/* PAGE NAVIGATION */
function showWelcome() {
    welcomePage.classList.remove("hidden");
    loginPage.classList.add("hidden");
    introPage.classList.add("hidden");
    dashboard.classList.add("hidden");
}

function showDashboard() {
    welcomePage.classList.add("hidden");
    loginPage.classList.add("hidden");
    introPage.classList.add("hidden");
    dashboard.classList.remove("hidden");

    displayExpenses();
}


/* WELCOME BUTTON */
document.getElementById("getStartedBtn").addEventListener("click", function() {
    welcomePage.classList.add("hidden");
    loginPage.classList.remove("hidden");
});


/* LOGIN */
loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (email !== "" && password !== "") {
        localStorage.setItem("loggedIn", "true");

        loginPage.classList.add("hidden");
        introPage.classList.remove("hidden");

        loginForm.reset();
    }
});


/* INTRODUCTION BUTTON */
document.getElementById("continueBtn").addEventListener("click", function() {
    showDashboard();
});


/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", function() {
    localStorage.removeItem("loggedIn");
    showWelcome();
});


/* ADD EXPENSE */
expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (name === "" || !Number.isFinite(amount) ||
        amount <= 0 || category === "" || date === "") {
        alert("Please enter valid expense details.");
        return;
    }

    const expense = {
        id: Date.now() + Math.random(),
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    expenses.push(expense);

    saveExpenses();
    expenseForm.reset();

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    displayExpenses();
});


/* DELETE EXPENSE */
document.getElementById("expenseList").addEventListener("click", function(event) {
    if (event.target.classList.contains("delete-btn")) {
        const id = Number(event.target.dataset.id);

        expenses = expenses.filter(function(expense) {
            return expense.id !== id;
        });

        saveExpenses();
        displayExpenses();
    }
});


/* DISPLAY EXPENSES */
function displayExpenses() {
    const expenseList = document.getElementById("expenseList");

    expenseList.replaceChildren();

    const searchText = document.getElementById("search").value.toLowerCase();
    const selectedCategory = document.getElementById("filter").value;

    const filteredExpenses = expenses.filter(function(expense) {
        const matchesName = expense.name.toLowerCase().includes(searchText);
        const matchesCategory =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        return matchesName && matchesCategory;
    });

    /* DISPLAY TABLE */
    if (filteredExpenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No expenses found.";

        row.appendChild(cell);
        expenseList.appendChild(row);
    } else {
        filteredExpenses.forEach(function(expense) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            const amountCell = document.createElement("td");
            const categoryCell = document.createElement("td");
            const dateCell = document.createElement("td");
            const actionCell = document.createElement("td");

            nameCell.textContent = expense.name;
            amountCell.textContent = "₹" + expense.amount.toFixed(2);
            categoryCell.textContent = expense.category;
            dateCell.textContent = expense.date;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";
            deleteButton.dataset.id = expense.id;

            actionCell.appendChild(deleteButton);

            row.append(
                nameCell,
                amountCell,
                categoryCell,
                dateCell,
                actionCell
            );

            expenseList.appendChild(row);
        });
    }

    updateSummary();
    updateChart();
    updateMonthlyReport();
}


/* UPDATE SUMMARY CARDS */
function updateSummary() {
    let total = 0;
    let monthlyTotal = 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    expenses.forEach(function(expense) {
        total += expense.amount;

        const parts = expense.date.split("-");

        const expenseYear = Number(parts[0]);
        const expenseMonth = Number(parts[1]) - 1;

        if (expenseMonth === currentMonth &&
            expenseYear === currentYear) {
            monthlyTotal += expense.amount;
        }
    });

    const remaining = budget - monthlyTotal;

    document.getElementById("total").textContent =
        "₹" + total.toFixed(2);

    document.getElementById("monthlyTotal").textContent =
        "₹" + monthlyTotal.toFixed(2);

    document.getElementById("remaining").textContent =
        "₹" + remaining.toFixed(2);

    document.getElementById("count").textContent = expenses.length;


    /* UPDATE BUDGET PROGRESS */
    let percentage = (monthlyTotal / budget) * 100;

    percentage = Math.min(percentage, 100);

    document.getElementById("progress").style.width =
        percentage + "%";

    const message = document.getElementById("budgetMessage");

    if (monthlyTotal > budget) {
        message.textContent = "⚠️ You have exceeded your monthly budget!";
    } else {
        message.textContent =
            "You have used " + percentage.toFixed(1) +
            "% of your monthly budget.";
    }
}


/* SAVE BUDGET */
document.getElementById("saveBudget").addEventListener("click", function() {
    const newBudget = Number(document.getElementById("budget").value);

    if (!Number.isFinite(newBudget) || newBudget <= 0) {
        alert("Please enter a valid budget.");
        return;
    }

    budget = newBudget;

    localStorage.setItem("budget", budget);

    document.getElementById("budget").value = "";

    updateSummary();
    alert("Budget saved successfully!");
});


/* SEARCH */
document.getElementById("search").addEventListener("input", function() {
    displayExpenses();
});


/* CATEGORY FILTER */
document.getElementById("filter").addEventListener("change", function() {
    displayExpenses();
});


/* EXPENSE CHART */
function updateChart() {
    const categories = {};

    expenses.forEach(function(expense) {
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }

        categories[expense.category] += expense.amount;
    });

    const labels = Object.keys(categories);
    const amounts = Object.values(categories);

    const chartCanvas = document.getElementById("expenseChart");

    if (expenseChart) {
        expenseChart.destroy();
        expenseChart = null;
    }

    if (typeof Chart === "undefined") {
        return;
    }

    expenseChart = new Chart(chartCanvas, {
        type: "doughnut",

        data: {
            labels: labels,
            datasets: [{
                label: "Expenses",
                data: amounts,
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ": ₹" +
                                context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}


/* MONTHLY REPORT */
function updateMonthlyReport() {
    const monthlyData = {};

    expenses.forEach(function(expense) {
        const month = expense.date.substring(0, 7);

        if (!monthlyData[month]) {
            monthlyData[month] = {
                total: 0,
                count: 0
            };
        }

        monthlyData[month].total += expense.amount;
        monthlyData[month].count++;
    });

    const report = document.getElementById("monthlyReport");
    report.replaceChildren();

    const months = Object.keys(monthlyData).sort().reverse();

    if (months.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.textContent = "No monthly records available.";

        row.appendChild(cell);
        report.appendChild(row);
        return;
    }

    months.forEach(function(month) {
        const data = monthlyData[month];
        const parts = month.split("-");

        const monthName = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1
        ).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

        const row = document.createElement("tr");

        const monthCell = document.createElement("td");
        const totalCell = document.createElement("td");
        const countCell = document.createElement("td");

        monthCell.textContent = monthName;
        totalCell.textContent = "₹" + data.total.toFixed(2);
        countCell.textContent = data.count;

        row.append(monthCell, totalCell, countCell);
        report.appendChild(row);
    });
}


/* DARK MODE */
function updateTheme() {
    const darkMode = localStorage.getItem("darkMode") === "true";

    document.body.classList.toggle("dark", darkMode);

    document.getElementById("themeBtn").textContent =
        darkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
}

document.getElementById("themeBtn").addEventListener("click", function() {
    const darkMode = document.body.classList.toggle("dark");

    localStorage.setItem("darkMode", darkMode);

    updateTheme();
});


/* SHOW CURRENT DATE */
document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });


/* SET TODAY'S DATE IN EXPENSE FORM */
document.getElementById("date").value =
    new Date().toISOString().split("T")[0];


/* START APPLICATION */
updateTheme();

if (localStorage.getItem("loggedIn") === "true") {
    showDashboard();
} else {
    showWelcome();
}

/* MONEY ADVISOR CHATBOT */

const chatToggle = document.getElementById("chatToggle");
const chatWindow = document.getElementById("chatWindow");
const closeChat = document.getElementById("closeChat");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");


/* OPEN AND CLOSE CHATBOT */

chatToggle.addEventListener("click", function() {
    chatWindow.classList.toggle("hidden");
});

closeChat.addEventListener("click", function() {
    chatWindow.classList.add("hidden");
});


/* ADD CHAT MESSAGE */

function addMessage(message, sender) {
    const messageDiv = document.createElement("div");

    messageDiv.className =
        sender === "user" ? "user-message" : "bot-message";

    messageDiv.textContent = message;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


/* GET THIS MONTH'S SPENDING */

function getMonthlySpending() {
    const now = new Date();

    return expenses
        .filter(function(expense) {
            const parts = expense.date.split("-");

            return Number(parts[0]) === now.getFullYear() &&
                   Number(parts[1]) === now.getMonth() + 1;
        })
        .reduce(function(sum, expense) {
            return sum + expense.amount;
        }, 0);
}


/* FIND HIGHEST SPENDING CATEGORY */

function getHighestCategory() {
    const categoryTotals = {};

    expenses.forEach(function(expense) {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const categories = Object.keys(categoryTotals);

    if (categories.length === 0) {
        return null;
    }

    let highest = categories[0];

    categories.forEach(function(category) {
        if (categoryTotals[category] > categoryTotals[highest]) {
            highest = category;
        }
    });

    return {
        name: highest,
        amount: categoryTotals[highest]
    };
}


/* CHATBOT ADVICE */

function getBotReply(question) {
    const text = question.toLowerCase();

    const monthlySpending = getMonthlySpending();
    const remaining = budget - monthlySpending;
    const highest = getHighestCategory();

    if (text.includes("hello") || text.includes("hi")) {
        return "Hello! 👋 I'm your Money Advisor. Ask me about your budget, expenses or saving tips.";
    }

    if (text.includes("total") || text.includes("spent")) {
        return "Your total recorded expenses are ₹" +
            expenses.reduce(function(sum, item) {
                return sum + item.amount;
            }, 0).toFixed(2) +
            ". Your spending this month is ₹" +
            monthlySpending.toFixed(2) + ".";
    }

    if (text.includes("budget") || text.includes("remaining")) {
        if (remaining < 0) {
            return "You have exceeded your monthly budget by ₹" +
                Math.abs(remaining).toFixed(2) +
                ". Try to pause non-essential purchases and review your expenses.";
        }

        return "Your monthly budget is ₹" + budget.toFixed(2) +
            ". You have ₹" + remaining.toFixed(2) +
            " remaining. Keep tracking your spending!";
    }

    if (text.includes("category") ||
        text.includes("most") ||
        text.includes("where")) {

        if (!highest) {
            return "You haven't added any expenses yet. Add some expenses so I can analyze your spending.";
        }

        return "Your highest recorded spending category is " +
            highest.name + " with ₹" +
            highest.amount.toFixed(2) +
            ". Review this category to see whether you can reduce unnecessary spending.";
    }

    if (text.includes("save") || text.includes("saving")) {
        return "Here are 4 simple saving tips:\n" +
            "1. Set a monthly spending limit.\n" +
            "2. Plan purchases before shopping.\n" +
            "3. Compare prices before buying.\n" +
            "4. Save a small amount regularly.";
    }

    if (text.includes("advice") || text.includes("reduce")) {
        if (expenses.length === 0) {
            return "Start by recording your expenses. Then I can suggest ways to reduce spending based on your records.";
        }

        return "My advice: review your " +
            (highest ? highest.name : "expenses") +
            " spending, plan purchases, and separate essential expenses from optional ones.";
    }

    if (text.includes("food")) {
        return "For food expenses, try planning meals, making a shopping list and avoiding unnecessary food purchases.";
    }

    if (text.includes("travel")) {
        return "For travel expenses, compare transport options and plan journeys in advance where possible.";
    }

    if (text.includes("shopping")) {
        return "For shopping, make a list, compare prices and wait before buying things you don't really need.";
    }

    return "I can help with your total spending, monthly budget, highest spending category and saving tips. Try asking: 'How much have I spent?'";
}


/* SEND CHAT MESSAGE */

chatForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const question = chatInput.value.trim();

    if (question === "") {
        return;
    }

    addMessage(question, "user");

    const reply = getBotReply(question);

    addMessage(reply, "bot");

    chatInput.value = "";
});
// CALCULATOR

function addCalc(value) {
    let display = document.getElementById("calcDisplay");

    if (display.value === "Error") {
        display.value = "";
    }

    display.value += value;
}

function clearCalc() {
    document.getElementById("calcDisplay").value = "";
}

function deleteCalc() {
    let display = document.getElementById("calcDisplay");
    display.value = display.value.slice(0, -1);
}

function calculateResult() {
    let display = document.getElementById("calcDisplay");
    let expression = display.value;

    if (!expression.trim()) {
        return;
    }

    // Allow only calculator characters
    if (!/^[0-9+\-*/.()\s]+$/.test(expression)) {
        display.value = "Error";
        return;
    }

    try {
        let result = Function(
            '"use strict"; return (' + expression + ')'
        )();

        if (!Number.isFinite(result)) {
            display.value = "Error";
        } else {
            display.value = String(
                Number(result.toFixed(8))
            );
        }
    } catch {
        display.value = "Error";
    }
}

