import time
import json
import random
import threading
from datetime import datetime


class IoTSimulator:
    """
    Simulates a smart gym device sending sensor data.
    Runs in a background thread, updating readings every 2 seconds.
    """

    def __init__(self):
        self.running   = False
        self.thread    = None
        self.session_active = False

        # Current sensor readings
        self.data = {
            "heart_rate":       0,
            "steps":            0,
            "calories_burned":  0.0,
            "resistance_level": 0,
            "speed_kmh":        0.0,
            "workout_duration": 0,
            "status":           "idle",
            "timestamp":        datetime.now().isoformat()
        }

        # Session totals
        self.session = {
            "start_time":      None,
            "total_steps":     0,
            "total_calories":  0.0,
            "avg_heart_rate":  0,
            "peak_heart_rate": 0,
            "readings_count":  0
        }

    def _simulate_reading(self):
        """Generate realistic sensor values."""
        if not self.session_active:
            return

        duration = self.data["workout_duration"] + 2

        # Heart rate: starts low, rises with workout
        base_hr = 70 + min(duration // 30, 50)
        hr = int(base_hr + random.randint(-5, 15))
        hr = max(60, min(hr, 185))

        # Steps: 100-150 per minute
        new_steps = random.randint(3, 5)

        # Calories: ~8-12 per minute
        new_cals = round(random.uniform(0.25, 0.4), 2)

        # Resistance and speed
        resistance = random.randint(3, 8)
        speed      = round(random.uniform(5.0, 12.0), 1)

        # Update current readings
        self.data.update({
            "heart_rate":       hr,
            "steps":            self.data["steps"] + new_steps,
            "calories_burned":  round(self.data["calories_burned"] + new_cals, 2),
            "resistance_level": resistance,
            "speed_kmh":        speed,
            "workout_duration": duration,
            "status":           "active",
            "timestamp":        datetime.now().isoformat()
        })

        # Update session stats
        self.session["total_steps"]    += new_steps
        self.session["total_calories"] += new_cals
        self.session["readings_count"] += 1
        self.session["peak_heart_rate"] = max(
            self.session["peak_heart_rate"], hr
        )
        # Rolling average heart rate
        count = self.session["readings_count"]
        prev_avg = self.session["avg_heart_rate"]
        self.session["avg_heart_rate"] = round(
            (prev_avg * (count - 1) + hr) / count, 1
        )

    def _run(self):
        while self.running:
            self._simulate_reading()
            time.sleep(2)

    def start_session(self):
        """Start a new workout session."""
        self.session_active = True
        self.running        = True
        self.data = {
            "heart_rate":       72,
            "steps":            0,
            "calories_burned":  0.0,
            "resistance_level": 1,
            "speed_kmh":        0.0,
            "workout_duration": 0,
            "status":           "active",
            "timestamp":        datetime.now().isoformat()
        }
        self.session = {
            "start_time":      datetime.now().isoformat(),
            "total_steps":     0,
            "total_calories":  0.0,
            "avg_heart_rate":  72,
            "peak_heart_rate": 72,
            "readings_count":  0
        }
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        return {"message": "Session started", "status": "active"}

    def stop_session(self):
        """Stop the workout session."""
        self.running        = False
        self.session_active = False
        self.data["status"] = "idle"
        summary = {
            **self.session,
            "end_time":        datetime.now().isoformat(),
            "final_readings":  self.data
        }
        return summary

    def get_readings(self):
        """Get current sensor readings."""
        return self.data

    def get_session_stats(self):
        """Get current session statistics."""
        return {
            **self.session,
            "current_readings": self.data,
            "session_active":   self.session_active
        }


# Global simulator instance
simulator = IoTSimulator()