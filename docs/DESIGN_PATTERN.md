# Design Pattern Used in NextStop

## Main Pattern: MVC (Model-View-Controller)

For the NextStop project, we used the **MVC (Model-View-Controller)** pattern. We chose this because it is a very standard, simple way to organize code, ensuring that different parts of our app don't get mixed up. 

By using MVC, we divided our project into three main parts:

### 1. Model (Data Layer)
This is where we define what our data looks like and how it is saved in the database.
- **Location in Code:** `api/src/models/`
- **What it does:** We created Models for entities like `Bus`, `Route`, and `Ticket`. For example, the Bus Model dictates that every bus must have a registration number and capacity.

### 2. View (User Interface)
This is the frontend part of the application that the user actually sees and clicks on on their screen. 
- **Location in Code:** `admin-portal/` (React Frontend)
- **What it does:** It displays buttons, tables, and dashboards. For example, it is responsible for rendering the table that lists all active buses.

### 3. Controller (Logic Layer)
This is the "brain" or the bridge between the View and the Model. It handles requests from the user and makes decisions.
- **Location in Code:** `api/src/routes/` (Backend APIs)
- **What it does:** When the frontend (View) asks for data, the Controller fetches it from the database (Model) and sends it back.

---

## How It Works (A Simple Example)

Let's look at the step-by-step flow of what happens when the Admin wants to see the list of all buses in the fleet:

1. **View:** The admin clicks on the "Fleet Management" tab on their screen. The frontend (View) sends a request to the backend saying, "Give me the list of buses."
2. **Controller:** The backend API (Controller) receives this request. It realizes it needs bus data, so it talks to the Model.
3. **Model:** The Model connects to the database, gathers all the saved bus records, and hands them back to the Controller.
4. **Controller:** The Controller takes this data and passes it back to the View.
5. **View:** Finally, the frontend receives the data and displays it neatly in a table for the Admin to see.

---

## Why MVC is good for our project

- **Very Organized:** The database code, the logic code, and the UI code are all kept in separate folders. It is easy to find where to fix a bug.
- **Teamwork:** One team member can build the frontend UI (View) while another works on the Backend (Controller/Model) without getting in each other's way.
- **Simplicity:** It is the most fundamental way to build structural applications, making it easy to understand and explain.
