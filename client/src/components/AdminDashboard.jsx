

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import AdminMap from "./AdminMap";
import StatCards from './StatCards';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  // Effect for fetching initial data once on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        setError("You must be logged in as an admin.");
        setLoading(false);
        return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    const fetchInitialData = async () => {
      try {
        const [reportsRes, statsRes] = await Promise.all([
          axios.get("https://backend-sih-project-l67a.onrender.com/api/admin/reports", { headers }),
          axios.get("https://backend-sih-project-l67a.onrender.com/api/analytics/stats", { headers }),
        ]);
        setReports(reportsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("❌ Error fetching initial data:", err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Effect for handling WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleNewReport = (newReport) => {
      console.log("Received new report via socket:", newReport);
      setReports((prevReports) => [newReport, ...prevReports]);
      
      // --- Start of Fix ---
      // Safely update stats to prevent crashes
      setStats(prevStats => {
        // If stats haven't been loaded yet, do nothing.
        if (!prevStats) return null;

        // Safely create a new statusCounts object
        const newStatusCounts = { ...(prevStats.statusCounts || {}) };
        newStatusCounts.new = (newStatusCounts.new || 0) + 1;

        return {
          ...prevStats,
          totalReports: (prevStats.totalReports || 0) + 1,
          statusCounts: newStatusCounts,
        };
      });
      // --- End of Fix ---
      
      toast.success(`New report submitted: "${newReport.title}"`);
    };

    socket.on('newReport', handleNewReport);

    return () => {
      socket.off('newReport', handleNewReport);
    };
  }, [socket]);

  // ... (rest of the component, getStatusClass, loading/error checks, and JSX remain the same)
  const getStatusClass = (status) => {
    switch (status) {
      case 'new': return 'status-new';
      case 'acknowledged': return 'status-acknowledged';
      case 'in_progress': return 'status-in-progress';
      case 'resolved': return 'status-resolved';
      default: return 'status-default';
    }
  };
  
 
  
  if (loading) {
    return (
        <div className="admin-container">
            <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading Dashboard Data...</p>
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="admin-container">
            <div className="error-message-full-page">{error}</div>
        </div>
    );
  }

 return (
    <div className="admin-container">
        <div className="admin-header">
            <h1>Reports Dashboard</h1>
            <p>An overview of all submitted civic issues.</p>
        </div>
        
        <StatCards stats={stats} />

        <div className="admin-map-container">
            <AdminMap reports={reports} />
        </div>

        <div className="admin-reports-grid">
            {reports.map((report) => (
                <Link to={`/admin/report/${report._id}`} key={report._id} className="admin-report-card-link">
                    <div className="admin-report-card">
                        <div className="card-main-info">
                            <div className="card-image-container">
                               {report.mediaUrls && report.mediaUrls[0] ? (
                                  <img src={report.mediaUrls[0]} alt={report.title} />
                               ) : (
                                  <div className="image-placeholder">No Image</div>
                               )}
                            </div>
                            <div className="card-details">
                                <span className={`status-badge ${getStatusClass(report.status)}`}>
                                    {report.status.replace('_', ' ')}
                                </span>
                                <h3 className="card-title">{report.title}</h3>
                                <p className="card-category">{report.category}</p>
                            </div>
                        </div>
                        <div className="card-meta-info">
                            <div className="meta-item">
                                <strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                            <div className="meta-item">
                                <strong>Assigned To:</strong> {report.assignedDept?.name || 'Unassigned'}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
  );
};

export default AdminDashboard;