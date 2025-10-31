import React from 'react';
import './css/About.css';
import takoTired from '../assets/tako_tired.png';

export default function About() {
  return (
    <div className="about-container">
      <div className="about-card">
        <img src={takoTired} alt="Tako Tired" className="about-img" />
        <h1 className="about-title">About TakoFocus</h1>
        <p className="about-text">
          TakoFocus is a simple, fun productivity app that combines a Pomodoro-style
          focus timer with task tracking — designed to conquer procrastination once and for all while helping you stay organized and motivated.
        </p>
        <br />
        <br />
        <p className="about-text">
          stay tuned for updates. . .
        </p>
       
        <footer className="about-footer">
          Established, Built & Developed by <span className="about-author">Heona Liu</span>
          <p>est. 2025</p>
        </footer>
      </div>
    </div>
  );
}
