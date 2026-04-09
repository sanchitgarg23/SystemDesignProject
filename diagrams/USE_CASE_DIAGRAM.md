# Use Case Diagram

## Project: NextStop — Government Bus Tracking 

This diagram visually represents the **Actors** (the people using the system) standing on the outside, and arrows pointing toward their specific **Use Cases** (the actions they take) inside the application boundary.

---

## 📊 Visual Diagram

```mermaid
flowchart LR
    %% The Actors (Using transparent borders so they just look like people)
    Admin["👨‍💼 Admin (Office)"]
    Passenger["🧍 Passenger (Traveler)"]
    Conductor["👨‍✈️ Conductor (Staff)"]

    %% The System Boundary
    subgraph System [NextStop Application]
        direction TB
        
        %% Admin Use Cases (Ovals)
        U1([Add / Remove Buses])
        U2([View Live Dashboard])
        U3([Check Daily Earnings])
        
        %% Passenger Use Cases
        U4([Search Bus Routes])
        U5([Track Bus Live Location])
        U6([Book QR e-Ticket])
        
        %% Conductor Use Cases
        U7([Issue Physical Tickets])
        U8([Scan Passenger QR Codes])
        U9([Sync Offline Ticket Data])
    end

    %% Arrows connecting Actors to their actions
    Admin --> U1
    Admin --> U2
    Admin --> U3

    Passenger --> U4
    Passenger --> U5
    Passenger --> U6

    Conductor --> U7
    Conductor --> U8
    Conductor --> U9

    %% Styling to make Actors look like stand-alone text/people without boxes
    classDef actor fill:none,stroke:none,font-weight:bold,font-size:16px;
    class Admin,Passenger,Conductor actor;

    %% Styling to make Use Cases look like classic light-blue ovals
    classDef usecase fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#000;
    class U1,U2,U3,U4,U5,U6,U7,U8,U9 usecase;
```

---

## 📋 Simple Explanation

This is the classic way to read this diagram:
- The **System Boundary** (the big box labeled "NextStop Application") represents everything inside our software.
- The **Actors** (the people on the left) interact with the software from the outside.
- The **Arrows** point exactly to what each person is allowed to do.

### Actors & Actions Breakdown:

1. **👨‍💼 Admin**: Sits in the back-office. They have the power to **manage the fleet** (buses and drivers), watch the **live tracking dashboard**, and review the **daily revenue**.
2. **🧍 Passenger**: Uses the system on their mobile phone. They mainly want to **find where the bus is**, **track it in real-time**, and **buy a digital ticket**.
3. **👨‍✈️ Conductor**: Operates on the physical bus. They use a hand-held machine to **print out tickets**, **scan tickets** bought by passengers digitally, and **upload** all that offline data to the server when they reach the depot.
