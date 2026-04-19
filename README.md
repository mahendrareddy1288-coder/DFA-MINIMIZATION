# DFA Minimization Simulator

A professional web-based **DFA Minimization Simulator** built using **HTML, CSS, and JavaScript**.
This project allows users to create a Deterministic Finite Automaton (DFA), test strings, visualize transitions, and minimize the DFA using the standard partitioning method.

---

## 📌 Project Overview

This project is designed for students learning **Theory of Computation / Automata Theory**. It provides a practical way to understand how DFAs work and how state minimization reduces complexity while preserving language acceptance.

The simulator performs:

* DFA creation
* Transition table generation
* String testing
* DFA visualization
* Unreachable state removal
* State minimization
* Step-by-step partition refinement

---

## 🚀 Features

### ✅ DFA Input Module

* Enter number of states
* Define alphabet symbols
* Select initial state
* Choose final states
* Generate dynamic transition table

### ✅ Transition Table

* Editable transitions
* Validates complete DFA transitions
* Supports multiple symbols

### ✅ DFA Visualizer

* Displays all states clearly
* Highlights:

  * Initial state
  * Final states
  * Normal states

### ✅ String Tester

* Enter any input string
* Simulates DFA step-by-step
* Displays Accepted / Rejected result

### ✅ DFA Minimization

Uses real minimization logic:

1. Remove unreachable states
2. Split final and non-final states
3. Refine partitions iteratively
4. Merge equivalent states
5. Generate minimized DFA

### ✅ Utility Features

* Example DFA Auto Fill
* Reset All Fields
* Responsive Design
* Modern UI Styling

---

## 🛠️ Technologies Used

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**

---

## 📂 Project Structure

```bash
DFA-Minimization-Simulator/
│── index.html
│── style.css
│── script.js
│── README.md
```

---

## ▶️ How to Run

1. Download or clone the repository:

```bash
git clone https://github.com/your-username/DFA-Minimization-Simulator.git
```

2. Open the folder

3. Run `index.html` in any browser

---

## 📖 How to Use

### Create DFA

1. Enter number of states
2. Enter alphabet (example: `0,1`)
3. Select initial state
4. Select final states
5. Fill transitions

### Test String

* Enter input string
* Click **Test String**

### Minimize DFA

* Click **Minimize DFA**
* View partitions and minimized machine

---

## 🧠 Example DFA

States: `q0, q1, q2, q3`

Alphabet: `0,1`

Initial State: `q0`

Final States: `q2, q3`

---

## 🎯 Educational Benefits

This project helps students understand:

* DFA construction
* Language acceptance
* Reachability
* Equivalent states
* Partitioning algorithm
* Optimization of automata

---

