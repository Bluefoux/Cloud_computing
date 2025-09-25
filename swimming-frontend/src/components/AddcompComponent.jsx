import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './../modules/AddcompComponent.module.css';

export default function AddcompComponent() {
  const navigate = useNavigate();

  const [compInfo, setCompInfo] = useState({
    CompName: '',
    StartDate: '',
    EndDate: '',
    CompetitionVenue: '',
    Organizer: '',
    NumberOfLanes: '',
    Length: '',
    IndividualStartFee: '',
    RelayStartFee: '',
    Description: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompInfo((prevCompInfo) => ({
      ...prevCompInfo,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const endpoint = process.env.REACT_APP_API_URL + '/public/add_competition';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compInfo),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error posting data:', error);
    }

    navigate('/');
  };

  return (
    <div>
      <div className={styles.navbar}>
        <nav className={styles.navbarInner}>
          <div className={styles.iconButton}>
            <div className={styles.iconWrapper}>
              <ArrowLeftButton onClick={() => navigate('/')} />
            </div>
          </div>
        </nav>
      </div>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.centeredContent}>
            <h1 className={styles.pageTitle}>Add Competition</h1>

            <input
              className={styles.textInput}
              type="text"
              name="CompName"
              placeholder="Competition Name"
              value={compInfo.CompName}
              onChange={handleChange}
            />

            <label>Start Date</label>
            <input
              className={styles.textInput}
              type="date"
              name="StartDate"
              value={compInfo.StartDate}
              onChange={handleChange}
            />

            <label>End Date</label>
            <input
              className={styles.textInput}
              type="date"
              name="EndDate"
              value={compInfo.EndDate}
              onChange={handleChange}
            />

            <input
              className={styles.textInput}
              type="text"
              name="CompetitionVenue"
              placeholder="Venue"
              value={compInfo.CompetitionVenue}
              onChange={handleChange}
            />

            <input
              className={styles.textInput}
              type="text"
              name="Organizer"
              placeholder="Organizer"
              value={compInfo.Organizer}
              onChange={handleChange}
            />

            <input
              className={styles.textInput}
              type="number"
              name="NumberOfLanes"
              placeholder="Number of Lanes"
              value={compInfo.NumberOfLanes}
              onChange={handleChange}
            />

            <input
              className={styles.textInput}
              type="number"
              name="Length"
              placeholder="Length (m)"
              value={compInfo.Length}
              onChange={handleChange}
            />

            <input
              className={styles.textInput}
              type="number"
              name="IndividualStartFee"
              placeholder="Individual Start Fee"
              value={compInfo.IndividualStartFee}
              onChange={handleChange}
            />

            <input
              className={styles.textInput}
              type="number"
              name="RelayStartFee"
              placeholder="Relay Start Fee"
              value={compInfo.RelayStartFee}
              onChange={handleChange}
            />

            <textarea
              className={styles.textArea}
              name="Description"
              placeholder="Description"
              value={compInfo.Description}
              onChange={handleChange}
            />

            <button className={styles.submitButton} onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function ArrowLeftButton({ onClick }) {
  return (
    <button onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
    </button>
  );
}
