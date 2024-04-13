import React, { useState, useEffect } from "react";
import { XYPlot, RadialChart, DiscreteColorLegend } from "react-vis";
import "react-vis/dist/style.css";
import "tailwindcss/tailwind.css";
import Login from "./Login";
import { gapi } from 'gapi-script';
import '../index.css'
function ExpenseTracker() {
    const [user, setUser] = useState(null);
    const [expenses, setExpenses] = useState([]);
/*     const [income, setIncome] = useState("");
 */ const [expenseName, setExpenseName] = useState("");
    const [expenseValue, setExpenseValue] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Food");
    const [categories, setCategories] = useState([
      "Food",
      "Living expenses",
      "Misc",
      "Health expenses",
      "Transportation",
      "Fees",
    ]);
    const [userId, setUserId] = useState("");
/*     const [isUserIdEntered, setIsUserIdEntered] = useState(false);
 */
    const colorPalette = {
      1: "#FF5733", // Category ID 1 (Red)
      2: "#93FF2D", // Category ID 2 (Green)
      3: "#2DAFFF", // Category ID 3 (Blue)
      4: "#562DFF", // Category ID 4 (Magenta)
      5: "#3B3B3F", // Category ID 5 (Yellow)
      6: "#33D1FF", // Category ID 6 (Cyan)
    };

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: '541778270792-s8llsorh3ut4fjmvdmjnjv7vttnipndb.apps.googleusercontent.com'
      });
    }

    gapi.load('client:auth', start);
  }, []);

  const displayUser = (profile) => {
    if (profile && profile.name && profile.email) {
      setUser(profile.name);
      sendUserDataToBackend(profile);
    } else {
      console.error("Invalid profile data:", profile);
    }
  };
  

  const sendUserDataToBackend = async (profile) => {
    try {
      const response = await fetch("http://localhost:5000/adduser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
        }),
      });
      fetchUserId(profile.email);

      if (!response.ok) {
        console.error("Failed to add user:", response.statusText);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };
  
  const fetchUserId = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/getuserid/${email}`);
      const data = await response.json();
      if (response.ok) {
        setUserId(data.userId);
        console.log("Received userId:", data.userId);
      } else {
        console.error("Failed to fetch userId:", response.statusText);
      }
      fetchExpenses(data.userId);
    } catch (error) {
      console.error("Error fetching userId:", error);
    }

    
  };
  
  
  
  const fetchExpenses = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/expensesforuser/${userId}`);
      const data = await response.json();
      setExpenses(data);
      console.log(expenses); // Log the updated expenses state

      
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  useEffect(() => {
    console.log(expenses);
  }, [expenses]);
  

 /*  const fetchIncome = async () => {
    try {
      const response = await fetch(`/userdetail/${userId}`);
      const data = await response.json();
      setIncome(data.income);
    } catch (error) {
      console.error("Error fetching income:", error);
    }
  }; */
/* 
  const handleUserProfile = (profileObj) => {
    setUserProfile(profileObj);
  };

  const handleUserIdEntered = () => {
    setIsUserIdEntered(true);
  }; */

  const handleAddExpense = async (event) => {
    event.preventDefault();
    if (expenseName && expenseValue) {
      try {
        const response = await fetch(`http://localhost:5000/addexpense`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            expense_name: expenseName,
            value: parseFloat(expenseValue),
            category_id: categories.indexOf(selectedCategory) + 1,
          }),
        });

        if (response.ok) {
          fetchExpenses(userId);
          setExpenseName("");
          setExpenseValue("");
        } else {
          console.error("Failed to add expense:", response.statusText);
        }
      } catch (error) {
        console.error("Error adding expense:", error);
      }
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const response = await fetch(`http://localhost:5000/deleteexpense/${expenseId}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        // Remove the deleted expense from the local state
        setExpenses((prevExpenses) =>
          prevExpenses.filter((expense) => expense.id !== expenseId)
        );
      } else {
        console.error("Failed to delete expense:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };
  

  const categoryTotals = categories.map((category) => {
    const totalValue = expenses
      .filter((expense) => expense.category_id === categories.indexOf(category) + 1)
      .reduce((acc, expense) => acc + expense.value, 0);
    console.log(totalValue);
    return { category, totalValue, category_id: categories.indexOf(category) + 1  };
  });

 /*  const totalExpenditure = categoryTotals.reduce(
    (acc, category) => acc + category.totalValue,
    0
  ); */
  return (
    <div className="container mx-auto px-4">
        {user ? (
            <>
                <div className="bg-gray-200 rounded-lg shadow-xl p-6">
                    <h1 className="text-4xl font-semibold text-center my-8 mt-5">Income Expense Tracker</h1>
                    <div className="flex flex-col md:flex-row md:justify-between items-start">
                        <div className="w-full md:w-2/5 mb-8 md:mr-8">
                            {/* Radial Chart */}
                            <RadialChart
                                data={categoryTotals.map((item) => ({
                                    angle: item.totalValue,
                                    label: item.category,
                                    /* color: colorPalette[item.category_id],  */
                                }))}
                                width={300}
                                height={300}
                                className="mx-auto"
                            />

                            {/* Legend */}
                            <DiscreteColorLegend
                                items={categoryTotals.map((item) => ({
                                    title: item.category,
                                    /* color: colorPalette[item.category_id],  */
                                }))}
                                orientation="horizontal"
                            />
                        </div>
                        <div className="w-full md:w-3/5">
                            {/* Expense Form */}
                            <form className="w-full md:w-3/4 mx-auto bg-gray-100 p-6 rounded-lg shadow-md mb-8">
                                <h2 className="text-lg font-semibold mb-4">Add Expense</h2>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Expense Name"
                                        value={expenseName}
                                        onChange={(e) => setExpenseName(e.target.value)}
                                        className="p-2 w-full border border-gray-300 rounded"
                                    />
                                </div>
                                <div className="mb-4">
                                    <input
                                        type="number"
                                        placeholder="Expense Value"
                                        value={expenseValue}
                                        onChange={(e) => setExpenseValue(e.target.value)}
                                        className="p-2 w-full border border-gray-300 rounded"
                                    />
                                </div>
                                <div className="mb-4">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="p-2 w-full border border-gray-300 rounded"
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddExpense}
                                    className="block w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                                >
                                    Add Expense
                                </button>
                            </form>

                            {/* Expenses List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {categories.map((category) => (
                                    <div key={category} className="mb-8">
                                        <h3 className="text-lg font-semibold mb-2">{category}</h3>
                                        <div className="space-y-4">
                                            {expenses
                                                .filter((expense) => expense.category_id === categories.indexOf(category) + 1)
                                                .map((expense, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <p className="text-xl font-semibold">{expense.expense_name}</p>
                                                            <p className="text-gray-600">₹{expense.value}</p>
                                                            <p className="text-gray-600 text-sm">{new Date(expense.timestamp).toLocaleDateString()}</p>
                                                        </div>
                                                        <div>
                                                            <button
                                                                onClick={() => handleDeleteExpense(expense.id)}
                                                                className="text-red-500 hover:text-red-700 ml-2"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <Login profile={displayUser} />
        )}
    </div>
);


      }
  export default ExpenseTracker;
  