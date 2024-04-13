import React, { useState, useEffect } from "react";
import ExpenseTracker from "./Page";

const StoreData = () => {
	const [userName, setUserName] = useState("");
	const [income, setIncome] = useState("");
	const [expenses, setExpenses] = useState([]);
	const [userDataSaved, setUserDataSaved] = useState(false);

	// Use a useEffect hook to load data from localStorage
	useEffect(() => {
		const storedExpenses = JSON.parse(localStorage.getItem("expenses"));
		if (storedExpenses) {
			setExpenses(storedExpenses);
		}
	}, []); // The empty dependency array ensures this effect runs only once when the component mounts

	// Function to handle saving user data
	const handleSaveData = () => {
		if (userName && income) {
			const userData = { userName, income };
			localStorage.setItem("userData", JSON.stringify(userData));
			setUserDataSaved(true); // Set the flag to true when data is saved
		}
	};

	return (
		<div>
			{!userDataSaved ? (
				<div>
					<h1>User Information:</h1>
					<div>
						<label>User Name:</label>
						<input
							type="text"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
						/>
					</div>
					<div>
						<label>Income:</label>
						<input
							type="number"
							value={income}
							onChange={(e) => setIncome(e.target.value)}
						/>
					</div>
					<button onClick={handleSaveData}>Save</button>
				</div>
			) : (
				<ExpenseTracker userName={userName} income={income} />
			)}
			{expenses.length > 0 ? (
				<div>
					<h1>Expenses:</h1>
					<ul>
						{expenses.map((expense, index) => (
							<li key={index}>{expense}</li>
						))}
					</ul>
				</div>
			) : (
				<h1>No Expenses</h1>
			)}
		</div>
	);
};

export default StoreData;
