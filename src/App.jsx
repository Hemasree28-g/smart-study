import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState([]);

  const quotes = [
    "Every completed task is progress toward your goal.",
    "Small wins build the strongest habits.",
    "One focused session brings you closer to mastery.",
    "Finish strong, then rest and reflect.",
    "Your dedication today shapes your success tomorrow.",
  ];


  const [quote, setQuote] = useState(
    "Success is the sum of small efforts repeated day in and day out."
  );

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [now, setNow] = useState(() => Date.now());

  const getNextQuote = (currentQuote) => {
    const currentIndex = quotes.indexOf(currentQuote);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % quotes.length;
    return quotes[nextIndex];
  };


  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
      oscillator.onended = () => audioCtx.close();
    } catch (error) {
      console.warn("Alarm audio failed:", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    tasks.forEach((task) => {
      if (task.completed || task.alerted) return;
      const deadline = new Date(task.deadline).getTime();
      if (deadline <= now) {
        playAlarm();
        setTasks((current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, alerted: true } : item
          )
        );
      }
    });
  }, [now, tasks]);

  const getRemaining = (deadline) => {
    const diff = new Date(deadline).getTime() - now;
    if (diff <= 0) return "Deadline reached";

    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / 1000 / 60) % 60;
    const hours = Math.floor(diff / 1000 / 3600) % 24;
    const days = Math.floor(diff / 1000 / 86400);

    return `${days > 0 ? `${days}d ` : ""}${String(hours).padStart(
      2,
      "0"
    )}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(
      2,
      "0"
    )}s`;
  };

  const addTask = () => {
    if (!subject || !date || !time) return;

    const deadline = `${date}T${time}:00`;
    const newTask = {
      id: Date.now(),
      subject,
      deadline,
      priority,
      completed: false,
      alerted: false,
    };

    setTasks([...tasks, newTask]);
    setSubject("");
    setDate("");
    setTime("");
  };

  const toggleTask = (id) => {
    let nextQuote = quote;
    const updatedTasks = tasks.map((task) => {
      if (task.id !== id) return task;

      const nextTask = { ...task, completed: !task.completed };
      if (!task.completed && nextTask.completed) {
        nextQuote = getNextQuote(nextQuote);
      }

      return nextTask;
    });

    setTasks(updatedTasks);
    if (nextQuote !== quote) {
      setQuote(nextQuote);

    }
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="container">
      <header>
        <h1>📚 Smart Study Planner</h1>
        <p>Plan. Study. Achieve.</p>
      </header>

      <div className="dashboard">
        <div className="card">
          <h3>Total Tasks</h3>
          <h2>{tasks.length}</h2>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <h2>{completedTasks}</h2>
        </div>
        <div className="card">
          <h3>Progress</h3>
          <h2>{progress}%</h2>
        </div>
      </div>

      <div className="task-form">
        <h2>Add Study Task</h2>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <div className="date-time-row">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button onClick={addTask}>Add Task</button>
      </div>

      <div className="task-list">
        <h2>Today's Tasks</h2>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Start planning your study day.</p>
        ) : (
          tasks.map((task) => {
            const deadlineTime = new Date(task.deadline).toLocaleString();
            const isOverdue =
              new Date(task.deadline).getTime() <= now && !task.completed;

            return (
              <div
                key={task.id}
                className={`task ${task.priority.toLowerCase()} ${
                  isOverdue ? "overdue" : ""
                }`}
              >
                <div>
                  <h3>{task.subject}</h3>
                  <p>{deadlineTime}</p>
                  <span>{task.priority}</span>
                  <div className="deadline-meta">
                    <strong>
                      {task.completed
                        ? "Finished"
                        : isOverdue
                        ? "Deadline reached"
                        : getRemaining(task.deadline)}
                    </strong>
                  </div>
                </div>

                <div className="actions">
                  <button onClick={() => toggleTask(task.id)}>
                    {task.completed ? "Undo" : "Done"}
                  </button>
                  <button onClick={() => deleteTask(task.id)}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="quote-card">
        <h2>Motivational Quote</h2>
        <p>{quote}</p>
      </div>

      <div className="auth-logout-row">
        <button
          className="auth-logout"
          type="button"
          onClick={() => setIsAuthenticated(false)}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;

