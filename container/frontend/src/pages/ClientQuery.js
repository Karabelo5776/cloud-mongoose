import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import './ClientQuery.css';

const ClientQuery = () => {
    const API_BASE = "http://localhost:5000/api";
    const [formData, setFormData] = useState({ 
        name: "", 
        email: "", 
        message: "" 
    });
    const [response, setResponse] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [queries, setQueries] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));

            if (!token || !user || user.role !== 'client') {
                navigate('/login');
                return false;
            }
            return true;
        };

        if (checkAuth()) {
            const user = JSON.parse(localStorage.getItem('user'));
            setFormData({
                name: user.name || "",
                email: user.email || "",
                message: ""
            });
            fetchQueries(user.email);
        }
    }, [navigate]);

    const fetchQueries = async (email) => {
        try {
            const res = await fetch(`${API_BASE}/my-queries?email=${email}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            
            // Transform the data to match frontend expectations
            const transformedQueries = data.map(query => ({
                ...query,
                id: query._id,
                created_at: query.createdAt,
                auto_reply: query.autoReply,
                status: query.status === 'complete' ? 'Completed' : 'Pending'
            }));
            
            setQueries(transformedQueries);
        } catch (err) {
            console.error("Error fetching queries:", err);
            setError("Failed to load query history");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitQuery = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) {
            setError("Please enter your query message");
            return;
        }

        setLoading(true);
        setError("");
        setResponse("");

        try {
            const res = await fetch(`${API_BASE}/submit-query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit query");

            setResponse(data.message);
            setFormData(prev => ({ ...prev, message: "" }));
            await fetchQueries(formData.email);
        } catch (err) {
            setError(err.message || "Server error, please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="client-query-container">
            <header>
                <h2>Client Dashboard</h2>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
                <nav>
                    <Link to="/clientpurchase" className="nav-link">Make Purchase</Link>
                    <Link to="/clientquery" className="nav-link active">Submit Query</Link>
                </nav>
            </header>

            <div className="query-content">
                <form onSubmit={handleSubmitQuery} className="query-form">
                    <h3>Submit a Query</h3>
                    <div className="form-group">
                        <label>Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea 
                            name="message" 
                            value={formData.message} 
                            onChange={handleChange} 
                            required 
                            placeholder="Enter your query here..." 
                            rows={5}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? "Submitting..." : "Submit Query"}
                    </button>
                </form>

                <div className="query-history">
                    <h3>Your Query History</h3>
                    {queries.length > 0 ? (
                        <div className="query-table-container">
                            <table className="query-table">
                                <thead>
                                    <tr>
                                        <th>Date Submitted</th>
                                        <th>Your Message</th>
                                        <th>Status</th>
                                        <th>Response</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queries.map(query => (
                                        <tr key={query.id} className="query-row">
                                            <td>{formatDate(query.created_at)}</td>
                                            <td className="query-message">{query.message}</td>
                                            <td>
                                                <span className={`status-badge ${query.status.toLowerCase()}`}>
                                                    {query.status}
                                                </span>
                                            </td>
                                            <td className="response-cell">
                                                {query.auto_reply || (
                                                    <span className="pending-response">Waiting for response...</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-queries">No queries submitted yet</p>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {response && <div className="success-message">{response}</div>}
        </div>
    );
};

export default ClientQuery;