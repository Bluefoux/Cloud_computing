import styles from './../modules/HomeComponent.module.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeComponent() {
  const navigate = useNavigate();

  const [competitions, setCompetitions] = useState([]);
  const [showCompetitions, setShowCompetitions] = useState(true);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const endpoint = process.env.REACT_APP_API_URL + '/public/home';
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCompetitions(data); // expecting array of competition objects
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
      }
    };

    fetchCompetitions();
  }, []);

  const handleSelectCompetition = (comp) => {
    setSelectedCompetitionId(comp.ID);
    setShowCompetitions(false);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toISOString().slice(0, 10);
  };

  const selectedCompetition =
    competitions.find((c) => c.ID === selectedCompetitionId) || null;

  let content = null;

  if (showCompetitions) {
    content = (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.centeredContent}>
            <h1 className={styles.pageTitle}>Competitions</h1>

            {competitions.length === 0 && (
              <p className={styles.subTitle}>No competitions found.</p>
            )}

            {competitions.map((comp) => (
              <div key={comp.ID} className={styles.card}>
                <h2 className={styles.cardTitle}>
                  {comp.CompName || 'Untitled Competition'}
                </h2>
                <p className={styles.cardText}>
                  {formatDate(comp.StartDate)} → {formatDate(comp.EndDate)}
                </p>
                <p className={styles.cardText}>
                  Venue: {comp.CompetitionVenue || '—'}
                </p>
                <button
                  className={styles.primaryButton}
                  onClick={() => handleSelectCompetition(comp)}
                >
                  View Details
                </button>
              </div>
            ))}

            <button
              className={styles.gradientButton}
              onClick={() => navigate('/Add_Competition')}
            >
              Add Competition
            </button>
          </div>
        </div>
      </section>
    );
  }
  else if (selectedCompetition) {
    content = (
      <section className={styles.section}>
        <div className={`${styles.container} ${styles.textCenter}`}>
          <h1 className={styles.pageTitle}>{selectedCompetition.CompName}</h1>
          <div className={styles.card}>
            <p className={styles.cardText}>
              <strong>Dates:</strong> {formatDate(selectedCompetition.StartDate)} → {formatDate(selectedCompetition.EndDate)}
            </p>
            <p className={styles.cardText}>
              <strong>Venue:</strong> {selectedCompetition.CompetitionVenue || '—'}
            </p>
            <p className={styles.cardText}>
              <strong>Organizer:</strong> {selectedCompetition.Organizer || '—'}
            </p>
            <p className={styles.cardText}>
              <strong>Number of Lanes:</strong> {selectedCompetition.NumberOfLanes ?? '—'}
            </p>
            <p className={styles.cardText}>
              <strong>Length:</strong> {selectedCompetition.Length ?? '—'}
            </p>
            <p className={styles.cardText}>
              <strong>Individual Start Fee:</strong> {selectedCompetition.IndividualStartFee ?? '—'}
            </p>
            <p className={styles.cardText}>
              <strong>Relay Start Fee:</strong> {selectedCompetition.RelayStartFee ?? '—'}
            </p>
            <p className={styles.cardText}>
              <strong>Description:</strong> {selectedCompetition.Description || '—'}
            </p>

            <div className={styles.actionsRow}>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowCompetitions(true)}
              >
                Back to list
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  } else {
    content = null;
  }

  return <>{content}</>;
}

